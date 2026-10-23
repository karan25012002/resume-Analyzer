package com.ai.Resume.analyser.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class resultsDto {

    private int score;
    private int atsoptimizationscore;
    private String summary;
    private List<String> pros;
    private List<String> cons;
    private List<String> suggestions;
    private List<String> detectedSkills;
    private List<String> missingSkills;
    private List<Job> jobs;

    public resultsDto(int score, int atsoptimizationscore, List<String> pros, List<String> cons, List<String> suggestions, List<Job> jobs) {
        this.score = score;
        this.atsoptimizationscore = atsoptimizationscore;
        this.pros = pros;
        this.cons = cons;
        this.suggestions = suggestions;
        this.jobs = jobs;
    }
}
