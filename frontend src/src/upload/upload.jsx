import { toast } from "react-toastify";
import Styles from "./upload.module.css";
import { useContext, useState, useRef } from "react";
import { usercontext } from "../appcontext";
import { useNavigate } from "react-router-dom";

function Uploadpage() {
    const { serviceURL } = useContext(usercontext);
    const navigate = useNavigate();

    const [role, setRole] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(1);
    const fileInputRef = useRef(null);

    const popularRoles = [
        "Full Stack Developer",
        "Software Engineer",
        "Frontend Engineer",
        "Backend Developer",
        "Data Scientist",
        "DevOps Engineer"
    ];

    const handleFile = (file) => {
        if (!file) return;

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
            toast.error("Please upload a PDF or DOC/DOCX file");
            setSelectedFile(null);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be under 5 MB");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        toast.info(`Selected: ${file.name}`);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!role.trim()) {
            toast.warn("Please enter or select a target role");
            return;
        }

        if (!selectedFile) {
            toast.warn("Please upload your resume");
            return;
        }

        setIsAnalysing(true);
        setAnalysisStep(1);

        // Advance progress animation
        const stepTimer1 = setTimeout(() => setAnalysisStep(2), 2200);
        const stepTimer2 = setTimeout(() => setAnalysisStep(3), 4500);

        const formData = new FormData();
        const combinedRole = jobDescription.trim()
            ? `${role.trim()} (Target Requirements: ${jobDescription.trim()})`
            : role.trim();

        formData.append("roles", combinedRole);
        formData.append("file", selectedFile);

        fetch(`${serviceURL}/extract`, {
            method: "post",
            body: formData,
            credentials: "include"
        })
            .then(async (response) => {
                if (response.ok) {
                    toast.success("Resume analyzed successfully!");
                    navigate("/analysereport");
                } else {
                    const errorText = await response.text();
                    toast.error(errorText || "Analysis failed. Please check resume content.");
                }
            })
            .catch(() => {
                toast.error("Network error while connecting to server");
            })
            .finally(() => {
                clearTimeout(stepTimer1);
                clearTimeout(stepTimer2);
                setIsAnalysing(false);
            });
    };

    return (
        <div className={Styles.container}>
            {/* Nav */}
            <header className={Styles.nav}>
                <div className={Styles.navBrand} onClick={() => navigate("/")}>
                    <div className={Styles.brandIcon}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h1>Resume<span>AI</span></h1>
                </div>
                <button className={Styles.homeBtn} onClick={() => navigate("/")}>
                    <i className="fa-solid fa-house"></i> Home
                </button>
            </header>

            <div className={Styles.mainLayout}>
                {/* Upload Form Card */}
                <div className={Styles.uploadCard}>
                    <div className={Styles.cardHeader}>
                        <h2>Upload Resume for ATS Audit</h2>
                        <p>Evaluate your qualifications against industry benchmarks with Google Gemini AI</p>
                    </div>

                    <form onSubmit={handleSubmit} className={Styles.form}>
                        {/* Target Role Input */}
                        <div className={Styles.inputGroup}>
                            <label htmlFor="roleInput">
                                Target Role <span className={Styles.required}>*</span>
                            </label>
                            <input
                                id="roleInput"
                                type="text"
                                placeholder="e.g. Senior Full Stack Developer"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className={Styles.textInput}
                                disabled={isAnalysing}
                            />

                            {/* Popular Role Quick Select */}
                            <div className={Styles.quickRoles}>
                                <span className={Styles.quickRolesLabel}>Quick select:</span>
                                {popularRoles.map((r, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        className={`${Styles.roleChip} ${role === r ? Styles.roleChipActive : ''}`}
                                        onClick={() => setRole(r)}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div className={Styles.inputGroup}>
                            <label>Resume File (PDF, DOC, DOCX) <span className={Styles.required}>*</span></label>
                            <div
                                className={`${Styles.dropZone} ${isDragging ? Styles.dropZoneActive : ''} ${selectedFile ? Styles.dropZoneSelected : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx"
                                    hidden
                                />

                                {!selectedFile ? (
                                    <div className={Styles.dropPrompt}>
                                        <div className={Styles.uploadCloudIcon}>
                                            <i className="fa-solid fa-cloud-arrow-up"></i>
                                        </div>
                                        <p className={Styles.primaryPrompt}>Click to browse or drag and drop your resume</p>
                                        <span className={Styles.secondaryPrompt}>Supports PDF, DOC, DOCX (Max 5MB)</span>
                                    </div>
                                ) : (
                                    <div className={Styles.fileInfoContainer}>
                                        <div className={Styles.fileIcon}>
                                            <i className="fa-solid fa-file-pdf"></i>
                                        </div>
                                        <div className={Styles.fileDetails}>
                                            <span className={Styles.fileName}>{selectedFile.name}</span>
                                            <span className={Styles.fileSize}>
                                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className={Styles.removeFileBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                            }}
                                        >
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Optional Job Description Box */}
                        <div className={Styles.inputGroup}>
                            <label htmlFor="jdInput">
                                Target Job Description / Requirements <span className={Styles.optional}>(Optional)</span>
                            </label>
                            <textarea
                                id="jdInput"
                                rows={3}
                                placeholder="Paste specific requirements, keywords, or job responsibilities for a tailored match..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className={Styles.textArea}
                                disabled={isAnalysing}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={Styles.analyseButton}
                            disabled={isAnalysing}
                        >
                            {isAnalysing ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i> Analyzing with AI...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-wand-magic-sparkles"></i> Launch Deep Analysis
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Guidelines Sidebar */}
                <aside className={Styles.sidebarCard}>
                    <div className={Styles.sidebarHeader}>
                        <i className="fa-solid fa-circle-info"></i>
                        <h3>ATS Audit Tips</h3>
                    </div>
                    <ul className={Styles.guidelinesList}>
                        <li>
                            <strong>Clean Standard Formats:</strong> Use PDF or Word format with standard fonts (Arial, Calibri, Poppins).
                        </li>
                        <li>
                            <strong>Chronological Structure:</strong> Ensure experience is listed in reverse chronological order with clear dates.
                        </li>
                        <li>
                            <strong>Impact-Driven Metrics:</strong> Quantify your achievements (e.g., "Increased performance by 40%").
                        </li>
                        <li>
                            <strong>Avoid Multi-Columns:</strong> Simple single-column layouts parse with higher ATS reliability.
                        </li>
                    </ul>
                </aside>
            </div>

            {/* Futuristic Loading Modal */}
            {isAnalysing && (
                <div className={Styles.loadingOverlay}>
                    <div className={Styles.loadingBox}>
                        <div className={Styles.loaderRing}>
                            <div className={Styles.innerOrb}></div>
                        </div>
                        <h3>Analyzing Your Resume</h3>
                        <p className={Styles.loadingSubtitle}>Evaluating with Google Gemini 2.5 Flash...</p>

                        <div className={Styles.stepsList}>
                            <div className={`${Styles.stepItem} ${analysisStep >= 1 ? Styles.stepActive : ''}`}>
                                <i className={`fa-solid ${analysisStep > 1 ? 'fa-check' : 'fa-circle-dot'}`}></i>
                                <span>1. Parsing document text via Apache Tika</span>
                            </div>
                            <div className={`${Styles.stepItem} ${analysisStep >= 2 ? Styles.stepActive : ''}`}>
                                <i className={`fa-solid ${analysisStep > 2 ? 'fa-check' : 'fa-circle-dot'}`}></i>
                                <span>2. Auditing keywords & ATS role alignment</span>
                            </div>
                            <div className={`${Styles.stepItem} ${analysisStep >= 3 ? Styles.stepActive : ''}`}>
                                <i className={`fa-solid ${analysisStep >= 3 ? 'fa-circle-notch fa-spin' : 'fa-circle-dot'}`}></i>
                                <span>3. Generating skill matrix & action points</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Uploadpage;
