package com.ai.Resume.analyser.controller;

import com.ai.Resume.analyser.service.appService;
import org.apache.tika.exception.TikaException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("resumeAnalyserCore/service/v1")
public class appController {

    @Autowired
    private appService appServices;

    @PostMapping("/extract")
    public ResponseEntity<?> extract(@RequestParam String roles, @RequestParam MultipartFile file) throws TikaException, IOException, InterruptedException {
        return appServices.extract(roles, file);
    }

    @GetMapping("/lastReport")
    public ResponseEntity<?> lastReport() {
        return appServices.lastReport();
    }

    @PostMapping("/rewriteBullet")
    public ResponseEntity<?> rewriteBullet(@RequestBody Map<String, String> body) {
        return appServices.rewriteBullet(body.get("bullet"), body.get("role"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return appServices.logout();
    }

    @PostMapping("/deleteAccount")
    public ResponseEntity<?> deleteAccount() {
        return appServices.deleteAccount();
    }

    @PostMapping("/isValid")
    public ResponseEntity<?> tokenValidation() {
        return appServices.tokenValidation();
    }
}
