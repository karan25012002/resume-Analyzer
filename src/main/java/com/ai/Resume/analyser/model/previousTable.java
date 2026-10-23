package com.ai.Resume.analyser.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class previousTable {

    @Id
    private String email;

    private int score;
    private int atsoptimizationscore;
    private String roles;

    @Column(length = 1000)
    private String summary;

    @ElementCollection
    @Column(length = 450)
    private List<String> pros;

    @ElementCollection
    @Column(length = 450)
    private List<String> cons;

    @ElementCollection
    @Column(length = 450)
    private List<String> suggestions;

    @ElementCollection
    @Column(length = 200)
    private List<String> detectedSkills;

    @ElementCollection
    @Column(length = 200)
    private List<String> missingSkills;

    // Backward-compatible constructor
    public previousTable(String email, int score, int atsoptimizationscore, String roles, List<String> pros, List<String> cons, List<String> suggestions) {
        this.email = email;
        this.score = score;
        this.atsoptimizationscore = atsoptimizationscore;
        this.roles = roles;
        this.pros = pros;
        this.cons = cons;
        this.suggestions = suggestions;
    }
}
