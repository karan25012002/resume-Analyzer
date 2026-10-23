import { useContext, useEffect, useState } from "react";
import Styles from "./analyse.module.css";
import { Heat } from "@alptugidin/react-circular-progress-bar";
import { usercontext } from "../appcontext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Analyse() {
    const navigate = useNavigate();
    const { serviceURL } = useContext(usercontext);

    const [score, setscore] = useState(0);
    const [atsscore, setatsscore] = useState(0);
    const [summary, setSummary] = useState("");
    const [pros, setpros] = useState([]);
    const [cons, setcons] = useState([]);
    const [sug, setsug] = useState([]);
    const [detectedSkills, setDetectedSkills] = useState([]);
    const [missingSkills, setMissingSkills] = useState([]);
    const [jobs, setjobs] = useState([]);
    const [activeTab, setActiveTab] = useState("all");

    // Loading & state
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // AI Bullet Enhancer state
    const [bulletInput, setBulletInput] = useState("");
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewrittenBullets, setRewrittenBullets] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        fetch(`${serviceURL}/lastReport`, { credentials: "include" })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("No previous analysis found");
                }
            })
            .then(data => {
                if (data) {
                    setscore(data.score || 0);
                    setatsscore(data.atsoptimizationscore || 0);
                    setSummary(data.summary || "Your resume has been comprehensively evaluated against industry standards.");
                    setpros(data.pros || []);
                    setcons(data.cons || []);
                    setsug(data.suggestions || []);
                    setDetectedSkills(data.detectedSkills || []);
                    setMissingSkills(data.missingSkills || []);
                    setjobs(data.jobs || []);
                    setHasError(false);
                }
            })
            .catch(error => {
                console.error("Fetch report error:", error);
                setHasError(true);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [serviceURL]);

    const handleRewriteBullet = () => {
        if (!bulletInput.trim()) {
            toast.warn("Please enter a bullet point to enhance");
            return;
        }

        setIsRewriting(true);
        fetch(`${serviceURL}/rewriteBullet`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ bullet: bulletInput.trim(), role: "Professional" })
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Failed to rewrite bullet");
            })
            .then(data => {
                if (data && data.rewrites) {
                    setRewrittenBullets(data.rewrites);
                    toast.success("Generated 3 STAR-method variations!");
                }
            })
            .catch(err => {
                toast.error("Could not enhance bullet point: " + err.message);
            })
            .finally(() => {
                setIsRewriting(false);
            });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.info("Copied to clipboard!");
    };

    const getScoreVerdict = (val) => {
        if (val >= 85) return { label: "High ATS Match", color: "#10b981", badge: Styles.verdictGreen };
        if (val >= 70) return { label: "Competitive Match", color: "#38bdf8", badge: Styles.verdictBlue };
        if (val >= 50) return { label: "Moderate Alignment", color: "#f59e0b", badge: Styles.verdictAmber };
        return { label: "Needs Critical Optimization", color: "#ef4444", badge: Styles.verdictRed };
    };

    const overallVerdict = getScoreVerdict(score);

    return (
        <div className={Styles.container}>
            {/* Header / Nav */}
            <header className={`${Styles.nav} no-print`}>
                <div className={Styles.navBrand} onClick={() => navigate("/")}>
                    <div className={Styles.brandIcon}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h1>Resume<span>AI</span></h1>
                </div>

                <div className={Styles.headerActions}>
                    <button className={Styles.printBtn} onClick={() => window.print()}>
                        <i className="fa-solid fa-print"></i> Export PDF
                    </button>
                    <button className={Styles.newAuditBtn} onClick={() => navigate("/uploaddoc")}>
                        <i className="fa-solid fa-plus"></i> New Audit
                    </button>
                </div>
            </header>

            {/* Loading state */}
            {isLoading && (
                <div className={Styles.centerLoader}>
                    <div className={Styles.spinOrb}></div>
                    <h2>Generating Audit Report...</h2>
                    <p>Aggregating scores, skills matrix, and industry benchmarks</p>
                </div>
            )}

            {/* Error state */}
            {!isLoading && hasError && (
                <div className={Styles.errorContainer}>
                    <div className={Styles.errorIcon}>
                        <i className="fa-solid fa-file-circle-xmark"></i>
                    </div>
                    <h2>No Report Found</h2>
                    <p>You haven't uploaded a resume for analysis yet or your session expired.</p>
                    <button className={Styles.primaryActionBtn} onClick={() => navigate("/uploaddoc")}>
                        Upload Resume Now
                    </button>
                </div>
            )}

            {/* Main Report Dashboard */}
            {!isLoading && !hasError && (
                <main className={Styles.reportContent}>
                    {/* Hero Executive Summary Card */}
                    <section className={Styles.executiveBanner}>
                        <div className={Styles.execHeader}>
                            <div>
                                <span className={Styles.kicker}>AUDIT REPORT SUMMARY</span>
                                <h2>Candidate Evaluation Overview</h2>
                            </div>
                            <div className={`${Styles.verdictPill} ${overallVerdict.badge}`}>
                                <span className={Styles.dot}></span> {overallVerdict.label}
                            </div>
                        </div>
                        <p className={Styles.summaryText}>{summary}</p>
                    </section>

                    {/* Gauges & Metrics Grid */}
                    <section className={Styles.scoreGrid}>
                        {/* Overall Score */}
                        <div className={Styles.gaugeCard}>
                            <div className={Styles.gaugeHeader}>
                                <h3>Overall ATS Match</h3>
                                <span className={Styles.scoreNumber}>{score}/100</span>
                            </div>
                            <div className={Styles.gaugeWrapper}>
                                <Heat
                                    progress={score}
                                    range={{ from: 0, to: 100 }}
                                    sign={{ value: '', position: 'end' }}
                                    showValue={true}
                                    revertBackground={true}
                                    text={'Score'}
                                    sx={{
                                        barWidth: 8,
                                        bgColor: '#1e293b',
                                        bgStrokeColor: '#ffffff',
                                        valueSize: 14,
                                        textSize: 10,
                                        valueFamily: 'Poppins',
                                        textFamily: 'Poppins',
                                        valueColor: '#ffffff',
                                        textColor: '#94a3b8',
                                        loadingTime: 800,
                                        strokeLinecap: 'round',
                                        valueAnimation: true,
                                    }}
                                />
                            </div>
                            <p className={Styles.gaugeFooter}>Based on comprehensive corporate hiring rubrics</p>
                        </div>

                        {/* ATS Optimization Score */}
                        <div className={Styles.gaugeCard}>
                            <div className={Styles.gaugeHeader}>
                                <h3>ATS Formatting Readiness</h3>
                                <span className={Styles.scoreNumber}>{atsscore}/100</span>
                            </div>
                            <div className={Styles.gaugeWrapper}>
                                <Heat
                                    progress={atsscore}
                                    range={{ from: 0, to: 100 }}
                                    sign={{ value: '', position: 'end' }}
                                    showValue={true}
                                    revertBackground={true}
                                    text={'ATS Format'}
                                    sx={{
                                        barWidth: 8,
                                        bgColor: '#1e293b',
                                        bgStrokeColor: '#ffffff',
                                        valueSize: 14,
                                        textSize: 10,
                                        valueFamily: 'Poppins',
                                        textFamily: 'Poppins',
                                        valueColor: '#ffffff',
                                        textColor: '#94a3b8',
                                        loadingTime: 800,
                                        strokeLinecap: 'round',
                                        valueAnimation: true,
                                    }}
                                />
                            </div>
                            <p className={Styles.gaugeFooter}>Section clarity, parsing compatibility & keyword density</p>
                        </div>

                        {/* Breakdown Categories Mini Card */}
                        <div className={Styles.breakdownCard}>
                            <h3>Dimension Breakdown</h3>
                            <div className={Styles.dimensionItem}>
                                <div className={Styles.dimLabel}>
                                    <span>Contact & Layout</span>
                                    <span>{score >= 60 ? 'Pass' : 'Review'}</span>
                                </div>
                                <div className={Styles.dimBar}>
                                    <div className={Styles.dimFill} style={{ width: `${Math.min(score + 10, 100)}%`, background: '#10b981' }}></div>
                                </div>
                            </div>

                            <div className={Styles.dimensionItem}>
                                <div className={Styles.dimLabel}>
                                    <span>Keywords & Relevance</span>
                                    <span>{score}%</span>
                                </div>
                                <div className={Styles.dimBar}>
                                    <div className={Styles.dimFill} style={{ width: `${score}%`, background: '#38bdf8' }}></div>
                                </div>
                            </div>

                            <div className={Styles.dimensionItem}>
                                <div className={Styles.dimLabel}>
                                    <span>ATS Machine Readability</span>
                                    <span>{atsscore}%</span>
                                </div>
                                <div className={Styles.dimBar}>
                                    <div className={Styles.dimFill} style={{ width: `${atsscore}%`, background: '#818cf8' }}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Skills Matrix Section */}
                    {(detectedSkills.length > 0 || missingSkills.length > 0) && (
                        <section className={Styles.skillsSection}>
                            <div className={Styles.skillsCard}>
                                <div className={Styles.skillsCardHeader}>
                                    <i className="fa-solid fa-circle-check" style={{ color: "#10b981" }}></i>
                                    <h3>Detected Skills in Resume</h3>
                                    <span className={Styles.countBadge}>{detectedSkills.length} Identified</span>
                                </div>
                                <div className={Styles.skillsPillsContainer}>
                                    {detectedSkills.map((skill, index) => (
                                        <span key={index} className={Styles.detectedSkillPill}>
                                            <i className="fa-solid fa-check"></i> {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={Styles.skillsCard}>
                                <div className={Styles.skillsCardHeader}>
                                    <i className="fa-solid fa-triangle-exclamation" style={{ color: "#f59e0b" }}></i>
                                    <h3>Recommended Skills to Add</h3>
                                    <span className={Styles.countBadgeAmber}>{missingSkills.length} High Demand</span>
                                </div>
                                <div className={Styles.skillsPillsContainer}>
                                    {missingSkills.map((skill, index) => (
                                        <span key={index} className={Styles.missingSkillPill}>
                                            <i className="fa-solid fa-plus"></i> {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* AI Resume Bullet Enhancer Tool */}
                    <section className={`${Styles.toolCard} no-print`}>
                        <div className={Styles.toolHeader}>
                            <div className={Styles.toolIcon}>
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <div>
                                <h3>Interactive AI Bullet Point Enhancer (STAR Method)</h3>
                                <p>Turn passive job duties into quantifiable, high-impact achievements</p>
                            </div>
                        </div>

                        <div className={Styles.toolBody}>
                            <div className={Styles.toolInputRow}>
                                <input
                                    type="text"
                                    placeholder="Paste a bullet point here (e.g. Worked on frontend development and resolved customer bugs)"
                                    value={bulletInput}
                                    onChange={(e) => setBulletInput(e.target.value)}
                                    className={Styles.bulletInput}
                                    onKeyDown={(e) => e.key === "Enter" && handleRewriteBullet()}
                                />
                                <button
                                    onClick={handleRewriteBullet}
                                    disabled={isRewriting}
                                    className={Styles.rewriteBtn}
                                >
                                    {isRewriting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i> Rewriting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-bolt"></i> Enhance with AI
                                        </>
                                    )}
                                </button>
                            </div>

                            {rewrittenBullets.length > 0 && (
                                <div className={Styles.rewritesList}>
                                    <h4>Suggested High-Impact Variations:</h4>
                                    {rewrittenBullets.map((bullet, idx) => (
                                        <div key={idx} className={Styles.rewriteItem}>
                                            <div className={Styles.rewriteBadge}>
                                                {idx === 0 ? "Results Focused" : idx === 1 ? "Technical Depth" : "Executive"}
                                            </div>
                                            <p className={Styles.rewriteText}>{bullet}</p>
                                            <button
                                                className={Styles.copyBtn}
                                                onClick={() => copyToClipboard(bullet)}
                                                title="Copy to clipboard"
                                            >
                                                <i className="fa-regular fa-copy"></i> Copy
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Detailed Analysis Tabs & Cards */}
                    <section className={Styles.detailsSection}>
                        {/* Tab Switcher */}
                        <div className={`${Styles.tabBar} no-print`}>
                            <button
                                className={`${Styles.tabBtn} ${activeTab === 'all' ? Styles.tabActive : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All Feedback ({pros.length + cons.length + sug.length})
                            </button>
                            <button
                                className={`${Styles.tabBtn} ${activeTab === 'pros' ? Styles.tabActive : ''}`}
                                onClick={() => setActiveTab('pros')}
                            >
                                Strengths ({pros.length})
                            </button>
                            <button
                                className={`${Styles.tabBtn} ${activeTab === 'cons' ? Styles.tabActive : ''}`}
                                onClick={() => setActiveTab('cons')}
                            >
                                Improvements ({cons.length})
                            </button>
                            <button
                                className={`${Styles.tabBtn} ${activeTab === 'sug' ? Styles.tabActive : ''}`}
                                onClick={() => setActiveTab('sug')}
                            >
                                Action Tips ({sug.length})
                            </button>
                        </div>

                        {/* Strengths Card */}
                        {(activeTab === 'all' || activeTab === 'pros') && (
                            <div className={Styles.feedbackCard}>
                                <div className={`${Styles.feedbackHeader} ${Styles.bgGreen}`}>
                                    <i className="fa-solid fa-circle-check"></i>
                                    <h3>Key Strengths & High-Scoring Areas</h3>
                                </div>
                                <ul className={Styles.feedbackList}>
                                    {pros.map((item, idx) => (
                                        <li key={idx}>
                                            <i className="fa-solid fa-check" style={{ color: "#10b981" }}></i>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Improvements Card */}
                        {(activeTab === 'all' || activeTab === 'cons') && (
                            <div className={Styles.feedbackCard}>
                                <div className={`${Styles.feedbackHeader} ${Styles.bgRed}`}>
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                    <h3>Areas That Need Improvement</h3>
                                </div>
                                <ul className={Styles.feedbackList}>
                                    {cons.map((item, idx) => (
                                        <li key={idx}>
                                            <i className="fa-solid fa-xmark" style={{ color: "#ef4444" }}></i>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Strategic Tips Card */}
                        {(activeTab === 'all' || activeTab === 'sug') && (
                            <div className={Styles.feedbackCard}>
                                <div className={`${Styles.feedbackHeader} ${Styles.bgPurple}`}>
                                    <i className="fa-solid fa-lightbulb"></i>
                                    <h3>Strategic Action Steps</h3>
                                </div>
                                <ul className={Styles.feedbackList}>
                                    {sug.map((item, idx) => (
                                        <li key={idx}>
                                            <i className="fa-solid fa-arrow-right" style={{ color: "#a855f7" }}></i>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Matched Job Recommendations */}
                    {jobs && jobs.length > 0 && (
                        <section className={Styles.jobsSection}>
                            <div className={Styles.jobsSectionHeader}>
                                <div>
                                    <span className={Styles.kicker}>CAREER MATCHES</span>
                                    <h2>Recommended Opportunities</h2>
                                </div>
                                <span className={Styles.jobCountBadge}>{jobs.length} Matching Positions</span>
                            </div>

                            <div className={Styles.jobsGrid}>
                                {jobs.map((job, index) => (
                                    <div className={Styles.jobCard} key={index}>
                                        <div className={Styles.jobMetaHeader}>
                                            <h3 className={Styles.jobTitle}>{job.title}</h3>
                                            <span className={Styles.jobCategory}>
                                                {job.category?.label || "Engineering"}
                                            </span>
                                        </div>

                                        <div className={Styles.jobBadgesRow}>
                                            <span className={Styles.jobBadge}>
                                                <i className="fa-regular fa-building"></i> {job.company?.display_name || "Confidential"}
                                            </span>
                                            <span className={Styles.jobBadge}>
                                                <i className="fa-solid fa-location-dot"></i> {job.location?.display_name || "Remote"}
                                            </span>
                                        </div>

                                        <p className={Styles.jobDescription}>
                                            {job.description ? job.description.substring(0, 150) + "..." : "Exciting position matching your profile."}
                                        </p>

                                        <a
                                            className={Styles.applyBtn}
                                            href={job.redirect_url || "https://www.linkedin.com/jobs"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Apply Now <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            )}
        </div>
    );
}

export default Analyse;
