import Styles from "./home.module.css";
import { useContext, useEffect, useState } from "react";
import { usercontext } from "../appcontext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Home() {
    const navigate = useNavigate();
    const { islogged, username, isprevious, serviceURL, setusername, setislogged, setisprevious } = useContext(usercontext);
    const [isshow, setshow] = useState(false);
    const [isloading, setisloading] = useState(false);
    const [delloading, setdelloading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest("#userProfileMenu") && !event.target.closest("#userProfileButton")) {
                setshow(false);
            }
        };

        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    const logout = () => {
        setisloading(true);
        fetch(`${serviceURL}/logout`, { method: "post", credentials: 'include' })
            .then(response => {
                if (response.ok) {
                    setusername("");
                    setislogged(false);
                    setisprevious(false);
                    toast.success("Successfully logged out");
                    navigate("/login");
                } else {
                    toast.error("Logout failed");
                }
            })
            .catch(() => toast.error("Network error on logout"))
            .finally(() => setisloading(false));
    };

    const delaccount = () => {
        setdelloading(true);
        fetch(`${serviceURL}/deleteAccount`, { method: "post", credentials: 'include' })
            .then(response => {
                if (response.ok) {
                    setislogged(false);
                    setShowDeleteModal(false);
                    setusername("");
                    setisprevious(false);
                    navigate("/login");
                    toast.success("Account deleted successfully");
                } else {
                    toast.error("Could not delete account. Please try again.");
                }
            })
            .catch(() => toast.error("Network error"))
            .finally(() => setdelloading(false));
    };

    const upnavigate = () => {
        if (islogged) {
            navigate("/uploaddoc");
        } else {
            navigate("/login");
        }
    };

    const displayInitial = username && username.length > 0 ? username[0].toUpperCase() : "U";

    return (
        <div className={Styles.container}>
            {/* Top Navigation */}
            <header className={Styles.nav}>
                <div className={Styles.navBrand} onClick={() => navigate("/")}>
                    <div className={Styles.brandIcon}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h1>Resume<span>AI</span></h1>
                </div>

                <div className={Styles.navActions}>
                    <div className={Styles.engineBadge}>
                        <span className={Styles.pulseDot}></span>
                        Gemini 2.5 Active
                    </div>

                    {!islogged ? (
                        <Link to={"/login"}>
                            <button className={Styles.loginBtn}>Sign In</button>
                        </Link>
                    ) : (
                        <div className={Styles.userContainer}>
                            <button
                                id="userProfileButton"
                                onClick={() => setshow(!isshow)}
                                className={Styles.profile}
                                aria-label="User Profile"
                            >
                                {displayInitial}
                            </button>

                            {isshow && (
                                <div id="userProfileMenu" className={Styles.profilemenu}>
                                    <div className={Styles.profileHeader}>
                                        <div className={Styles.avatarBig}>{displayInitial}</div>
                                        <div className={Styles.profileInfo}>
                                            <span className={Styles.userGreeting}>Signed in as</span>
                                            <span className={Styles.userName}>{username}</span>
                                        </div>
                                    </div>
                                    <hr className={Styles.divider} />
                                    <div className={Styles.pmenusec}>
                                        <button onClick={() => { setshow(false); navigate("/uploaddoc"); }}>
                                            <i className="fa-solid fa-file-arrow-up"></i> Upload Resume
                                        </button>
                                        {isprevious && (
                                            <button onClick={() => { setshow(false); navigate("/analysereport"); }}>
                                                <i className="fa-solid fa-chart-pie"></i> Last Report
                                            </button>
                                        )}
                                        <button onClick={logout} disabled={isloading}>
                                            <i className="fa-solid fa-right-from-bracket"></i> Logout
                                        </button>
                                        <button onClick={() => { setshow(false); setShowDeleteModal(true); }} className={Styles.delBtn}>
                                            <i className="fa-solid fa-trash-can"></i> Delete Account
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <main className={Styles.hero}>
                <div className={Styles.badgePill}>
                    <i className="fa-solid fa-bolt"></i> Next-Gen AI Career Assistant
                </div>

                <h1 className={Styles.heroTitle}>
                    Optimize Your Resume.<br />
                    <span>Beat the ATS & Land Interviews.</span>
                </h1>

                <p className={Styles.heroSubtitle}>
                    Get comprehensive, recruiter-level feedback on your resume powered by Google Gemini AI.
                    Discover keyword gaps, analyze ATS compatibility, and access instant role-targeted recommendations.
                </p>

                <div className={Styles.ctaContainer}>
                    <button className={Styles.primaryCta} onClick={upnavigate} disabled={isloading}>
                        <i className="fa-solid fa-sparkles"></i> Analyse Resume
                    </button>
                    {isprevious && (
                        <button className={Styles.secondaryCta} onClick={() => navigate("/analysereport")}>
                            <i className="fa-solid fa-chart-line"></i> View Last Report
                        </button>
                    )}
                </div>

                {/* Feature Highlights Grid */}
                <div className={Styles.featuresGrid}>
                    <div className={Styles.featureCard}>
                        <div className={`${Styles.featureIcon} ${Styles.iconBlue}`}>
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <h3>Enterprise ATS Score</h3>
                        <p>Strict evaluation model simulating Tier-1 corporate Applicant Tracking Systems.</p>
                    </div>

                    <div className={Styles.featureCard}>
                        <div className={`${Styles.featureIcon} ${Styles.iconGreen}`}>
                            <i className="fa-solid fa-tags"></i>
                        </div>
                        <h3>Skills Match Matrix</h3>
                        <p>Pinpoint exact technical skills matched and uncover missing high-demand competencies.</p>
                    </div>

                    <div className={Styles.featureCard}>
                        <div className={`${Styles.featureIcon} ${Styles.iconPurple}`}>
                            <i className="fa-solid fa-pen-fancy"></i>
                        </div>
                        <h3>AI Bullet Enhancer</h3>
                        <p>Convert passive statements into high-impact, quantifiable STAR-method achievements.</p>
                    </div>

                    <div className={Styles.featureCard}>
                        <div className={`${Styles.featureIcon} ${Styles.iconAmber}`}>
                            <i className="fa-solid fa-briefcase"></i>
                        </div>
                        <h3>Targeted Job Board</h3>
                        <p>Receive tailored job suggestions directly aligned with your analyzed skill profile.</p>
                    </div>
                </div>
            </main>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modalCard}>
                        <div className={Styles.modalIcon}>
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h2>Delete Account</h2>
                        <p>
                            Are you sure you want to delete your account? This action is permanent and will remove all your resume reports and account history.
                        </p>
                        <div className={Styles.modalButtons}>
                            <button
                                className={Styles.confirmDelBtn}
                                disabled={delloading}
                                onClick={delaccount}
                            >
                                {delloading ? "Deleting..." : "Yes, Delete"}
                            </button>
                            <button
                                className={Styles.cancelBtn}
                                disabled={delloading}
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
