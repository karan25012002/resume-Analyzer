package com.ai.Resume.analyser.service;

import com.ai.Resume.analyser.model.*;
import com.ai.Resume.analyser.repository.prevTable;
import com.ai.Resume.analyser.repository.usersTableRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.*;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class appService {

    @Value("${genKey}")
    private String genKey;

    @Value("${application-id:dummy_adzuna_id}")
    private String applicationId;

    @Value("${application-api-key:dummy_adzuna_key}")
    private String applicationApiKey;

    @Autowired
    private prevTable previousTableRepo;

    @Autowired
    private usersTableRepo usersTableRepository;

    public ResponseEntity<?> extract(String roles, MultipartFile file) throws TikaException, IOException, InterruptedException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("File cannot be empty");
        }

        Tika tika = new Tika();
        ByteArrayInputStream inputFile = new ByteArrayInputStream(file.getBytes());
        String extracted = tika.parseToString(inputFile);

        if (extracted == null || extracted.trim().isEmpty() || extracted.length() > 80000) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please upload a valid resume document");
        }

        Client client = Client.builder().apiKey(genKey).build();
        Content content = Content.builder().parts(
                Part.fromText("Candidate Resume Content:\n" + extracted),
                Part.fromText("Target Role: " + roles),
                Part.fromText("You are an expert enterprise-grade ATS resume evaluator, senior technical recruiter, and hiring manager.\n" +
                        "Evaluate this resume strictly for the target role: '" + roles + "'.\n" +
                        "Evaluate overall score (0-100) and ATS optimization score (0-100) using strict professional criteria.\n" +
                        "Return ONLY valid JSON matching this exact structure with NO surrounding markdown outside the json brackets:\n" +
                        "{\n" +
                        "  \"score\": 82,\n" +
                        "  \"atsoptimizationscore\": 85,\n" +
                        "  \"summary\": \"Concise 2-3 sentence executive assessment of the candidate profile and alignment with the target role.\",\n" +
                        "  \"pros\": [\"string\", \"string\", ...],\n" +
                        "  \"cons\": [\"string\", \"string\", ...],\n" +
                        "  \"suggestions\": [\"string\", \"string\", ...],\n" +
                        "  \"detectedSkills\": [\"string\", \"string\", ...],\n" +
                        "  \"missingSkills\": [\"string\", \"string\", ...]\n" +
                        "}\n" +
                        "Rules:\n" +
                        "- 'pros' array must contain 4 to 8 clear, distinct strength points (50-250 chars each).\n" +
                        "- 'cons' array must contain 4 to 8 clear areas for improvement (50-250 chars each).\n" +
                        "- 'suggestions' array must contain 4 to 8 actionable, strategic tips (50-250 chars each).\n" +
                        "- 'detectedSkills' must list 5 to 15 key technical or functional skills found in the resume.\n" +
                        "- 'missingSkills' must list 3 to 8 recommended high-demand skills for '" + roles + "' not found in the resume.\n" +
                        "- If the content is completely irrelevant or not a resume, return score: 0 and atsoptimizationscore: 0."
                )
        ).build();

        String results = null;
        Exception lastException = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                GenerateContentResponse response = client.models.generateContent("gemini-2.5-flash", content, null);
                results = response.text();
                if (results != null && !results.isBlank()) {
                    break;
                }
            } catch (Exception e) {
                lastException = e;
                System.err.println("Gemini API call attempt " + attempt + " failed: " + e.getMessage());
                Thread.sleep(1000);
            }
        }

        if (results == null || results.isBlank()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("AI Analysis service is busy. Please try again. " + (lastException != null ? lastException.getMessage() : ""));
        }

        if (results.contains("{")) {
            int firstBrace = results.indexOf("{");
            int lastBrace = results.lastIndexOf("}");
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                results = results.substring(firstBrace, lastBrace + 1);
            }
        }

        ObjectMapper objectMapper = new ObjectMapper();
        resultsDto analysisDto = null;
        try {
            analysisDto = objectMapper.readValue(results, resultsDto.class);
        } catch (Exception e) {
            System.err.println("Failed to parse JSON response: " + results);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to parse analysis results");
        }

        if (analysisDto != null && analysisDto.getScore() > 0) {
            String uname = SecurityContextHolder.getContext().getAuthentication().getName();
            previousTable processedData = previousTable.builder()
                    .email(uname)
                    .score(analysisDto.getScore())
                    .atsoptimizationscore(analysisDto.getAtsoptimizationscore())
                    .roles(roles)
                    .summary(analysisDto.getSummary())
                    .pros(analysisDto.getPros() != null ? analysisDto.getPros() : Collections.emptyList())
                    .cons(analysisDto.getCons() != null ? analysisDto.getCons() : Collections.emptyList())
                    .suggestions(analysisDto.getSuggestions() != null ? analysisDto.getSuggestions() : Collections.emptyList())
                    .detectedSkills(analysisDto.getDetectedSkills() != null ? analysisDto.getDetectedSkills() : Collections.emptyList())
                    .missingSkills(analysisDto.getMissingSkills() != null ? analysisDto.getMissingSkills() : Collections.emptyList())
                    .build();

            previousTableRepo.save(processedData);

            usersTable usermod = usersTableRepository.findById(uname).orElse(null);
            if (usermod != null) {
                usermod.setPreviousResults(true);
                usersTableRepository.save(usermod);
            }
            return new ResponseEntity<>("Analysed successfully", HttpStatus.OK);
        }

        return new ResponseEntity<>("Invalid document or resume content", HttpStatus.NOT_ACCEPTABLE);
    }

    public ResponseEntity<?> lastReport() {
        String uname = SecurityContextHolder.getContext().getAuthentication().getName();
        previousTable prev = previousTableRepo.findById(uname).orElse(null);

        if (prev != null) {
            List<Job> jobs = fetchJobsForRole(prev.getRoles());
            resultsDto reportDto = com.ai.Resume.analyser.model.resultsDto.builder()
                    .score(prev.getScore())
                    .atsoptimizationscore(prev.getAtsoptimizationscore())
                    .summary(prev.getSummary())
                    .pros(prev.getPros())
                    .cons(prev.getCons())
                    .suggestions(prev.getSuggestions())
                    .detectedSkills(prev.getDetectedSkills())
                    .missingSkills(prev.getMissingSkills())
                    .jobs(jobs)
                    .build();

            return ResponseEntity.ok(reportDto);
        } else {
            return new ResponseEntity<>("No previous Analysis", HttpStatus.NOT_FOUND);
        }
    }

    private List<Job> fetchJobsForRole(String role) {
        List<Job> jobs = new ArrayList<>();
        if (applicationId != null && !applicationId.isBlank() && !applicationId.startsWith("dummy") &&
            applicationApiKey != null && !applicationApiKey.isBlank() && !applicationApiKey.startsWith("dummy")) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                String encodedRole = URLEncoder.encode(role != null ? role : "Software", StandardCharsets.UTF_8);
                String url = "https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=" + applicationId + "&app_key=" + applicationApiKey + "&what=" + encodedRole + "&content-type=application/json";
                JobSearchResponse response = restTemplate.getForObject(url, JobSearchResponse.class);
                if (response != null && response.getResults() != null && !response.getResults().isEmpty()) {
                    jobs = response.getResults();
                    return jobs;
                }
            } catch (Exception e) {
                System.err.println("Adzuna API call failed: " + e.getMessage());
            }
        }

        // Curated fallback jobs if Adzuna is unconfigured or returns empty
        String searchRole = role != null && !role.isBlank() ? role : "Software Engineer";
        jobs.add(createSampleJob("1", searchRole + " - Remote / Hybrid", "TechCorp Global", "Remote / India", "Engineering",
                "Looking for a motivated " + searchRole + " with strong analytical skills, collaborative mindset, and experience in building modern applications.",
                "https://www.linkedin.com/jobs/"));
        jobs.add(createSampleJob("2", "Senior " + searchRole, "Innovate Solutions", "Bengaluru, India", "Technology",
                "Exciting opportunity for a " + searchRole + " to lead project initiatives, optimize system architecture, and collaborate with international stakeholders.",
                "https://www.indeed.com/"));
        jobs.add(createSampleJob("3", searchRole + " (Cloud & AI)", "NextGen Digital", "Hyderabad, India", "IT Services",
                "Join our cutting-edge team as a " + searchRole + ". You will develop scalable solutions and contribute to next-generation AI and cloud architectures.",
                "https://www.naukri.com/"));

        return jobs;
    }

    private Job createSampleJob(String id, String title, String companyName, String locName, String catName, String description, String url) {
        Job job = new Job();
        job.setId(id);
        job.setTitle(title);
        job.setDescription(description);
        job.setRedirect_url(url);

        Company company = new Company();
        company.setDisplay_name(companyName);
        job.setCompany(company);

        Location loc = new Location();
        loc.setDisplay_name(locName);
        job.setLocation(loc);

        Category cat = new Category();
        cat.setLabel(catName);
        job.setCategory(cat);

        return job;
    }

    public ResponseEntity<?> rewriteBullet(String bullet, String role) {
        if (bullet == null || bullet.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Bullet point cannot be empty");
        }

        try {
            Client client = Client.builder().apiKey(genKey).build();
            String prompt = "Rewrite the following resume bullet point for a candidate applying for the role '" + (role != null ? role : "Professional") + "'.\n" +
                    "Use the STAR method (Situation, Task, Action, Result) with strong action verbs and quantifiable metrics where appropriate.\n" +
                    "Return ONLY a JSON array with 3 distinct rewrites: 1) Results-Oriented, 2) Technical/Skills-Focused, 3) Concise & Direct.\n" +
                    "Input bullet: \"" + bullet + "\"\n" +
                    "Format: [\"rewrite 1\", \"rewrite 2\", \"rewrite 3\"]";

            GenerateContentResponse response = client.models.generateContent("gemini-2.5-flash", prompt, null);
            String text = response.text();
            if (text.contains("[")) {
                int start = text.indexOf("[");
                int end = text.lastIndexOf("]");
                if (start != -1 && end != -1) {
                    text = text.substring(start, end + 1);
                }
            }

            ObjectMapper mapper = new ObjectMapper();
            List<?> rewrites = mapper.readValue(text, List.class);
            Map<String, Object> resp = new HashMap<>();
            resp.put("original", bullet);
            resp.put("rewrites", rewrites);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to rewrite bullet: " + e.getMessage());
        }
    }

    public ResponseEntity<?> logout() {
        HttpHeaders headers = new HttpHeaders();
        ResponseCookie cookie = ResponseCookie.from("entrypasstoken", "").httpOnly(true).secure(false).sameSite("Strict").maxAge(0).path("/").build();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        return new ResponseEntity<>("Successfully loggedOut", headers, HttpStatus.OK);
    }

    public ResponseEntity<?> deleteAccount() {
        try {
            String uname = SecurityContextHolder.getContext().getAuthentication().getName();
            usersTableRepository.deleteById(uname);
            previousTableRepo.deleteById(uname);
            HttpHeaders headers = new HttpHeaders();
            ResponseCookie cookie = ResponseCookie.from("entrypasstoken", "").httpOnly(true).secure(false).sameSite("Strict").maxAge(0).path("/").build();
            headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
            return new ResponseEntity<>("Account deleted successfully", headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete", HttpStatus.NOT_FOUND);
        }
    }

    public ResponseEntity<?> tokenValidation() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        usersTable user = usersTableRepository.findById(name).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid token");
        }
        loginResponse loginRes = new loginResponse(user.getUsername(), user.getPreviousResults());
        return new ResponseEntity<>(loginRes, HttpStatus.OK);
    }
}
