import { useContext, useState, useEffect } from "react";
import Styles from "./resetpassword.module.css";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../appcontext";
import { toast } from "react-toastify";

function Forgotpassword() {
    const navigate = useNavigate();
    const [email, setemail] = useState("");
    const [otp, setotp] = useState(["", "", "", "", "", ""]);
    const [newpassword, setnewpassword] = useState("");
    const [confirmpassword, setconfirmpassword] = useState("");
    const [isloading, setisloading] = useState(false);
    const [isemailpresent, setisemailpresent] = useState(false);
    const [isemailverified, setisemailverified] = useState(false);
    const { backendURL, islogged } = useContext(usercontext);
    const [showpass, setshowpass] = useState(false);
    const [showconfirmpass, setshowconfirmpass] = useState(false);

    useEffect(() => {
        if (islogged) {
            navigate("/");
        }
    }, [islogged, navigate]);

    const handleInput = (index, event) => {
        const val = event.target.value.replace(/\D/g, "");
        if (val) {
            const tem = [...otp];
            tem[index] = val[val.length - 1];
            setotp(tem);
            if (index < 5) {
                const nextInput = document.getElementById(`reset-otp-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        } else {
            const tem = [...otp];
            tem[index] = "";
            setotp(tem);
        }
    };

    const handlebck = (index, event) => {
        if (event.key === "Backspace") {
            const tem = [...otp];
            tem[index] = "";
            setotp(tem);
            if (index > 0) {
                const prevInput = document.getElementById(`reset-otp-${index - 1}`);
                if (prevInput) prevInput.focus();
            }
        }
    };

    function validateEmail(email) {
        const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailregex.test(email);
    }

    const verifyemail = () => {
        if (email.trim() === "") {
            toast.warn("Email must not be empty");
            return;
        }
        if (!validateEmail(email.trim())) {
            toast.warn("Invalid Email address");
            return;
        }
        setisloading(true);
        fetch(`${backendURL}/resetOtpSent`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() })
        })
            .then(response => {
                if (response.ok) {
                    toast.success("OTP sent! (Also logged to backend console in dev mode)");
                    setisemailpresent(true);
                } else {
                    toast.error("Email address not found");
                }
            })
            .catch(() => toast.error("Verification request failed"))
            .finally(() => setisloading(false));
    };

    const verifyprocess = () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length < 6) {
            toast.error("Please enter the complete 6-digit OTP");
            return;
        }
        setisloading(true);
        fetch(`${backendURL}/verifyResetOtp`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), otp: enteredOtp })
        })
            .then(response => {
                if (response.ok) {
                    toast.success("OTP verified! Set your new password.");
                    setisemailverified(true);
                } else {
                    toast.error("Invalid or expired OTP");
                }
            })
            .catch(() => toast.error("Verification failed"))
            .finally(() => setisloading(false));
    };

    const resetpasswordsent = () => {
        const enteredOtp = otp.join("");
        if (newpassword.length < 6) {
            toast.warn("Password must have at least 6 characters");
            return;
        }
        if (newpassword !== confirmpassword) {
            toast.warn("Passwords do not match");
            return;
        }
        setisloading(true);
        fetch(`${backendURL}/resetPassword`, {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email.trim(),
                otp: enteredOtp,
                password: newpassword
            })
        })
            .then(response => {
                if (response.ok) {
                    toast.success("Password changed successfully! Please login.");
                    navigate("/login");
                } else {
                    toast.error("Could not update password. Please try again.");
                }
            })
            .catch(() => toast.error("Resetting failed"))
            .finally(() => setisloading(false));
    };

    return (
        <div className={Styles.container}>
            <header className={Styles.nav}>
                <div className={Styles.navBrand} onClick={() => navigate("/")}>
                    <div className={Styles.brandIcon}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h1>Resume<span>AI</span></h1>
                </div>
                <button className={Styles.homeBtn} onClick={() => navigate("/login")}>
                    <i className="fa-solid fa-arrow-left"></i> Back to Login
                </button>
            </header>

            <div className={Styles.cardWrapper}>
                {!isemailpresent && !isemailverified && (
                    <div className={Styles.card}>
                        <div className={Styles.cardHeader}>
                            <h1>Reset Password</h1>
                            <p>Enter the email address registered with your account</p>
                        </div>
                        <div className={Styles.inputField}>
                            <label>Email Address</label>
                            <input
                                onChange={(event) => setemail(event.target.value)}
                                type="email"
                                value={email}
                                placeholder="name@company.com"
                            />
                        </div>
                        <button
                            onClick={verifyemail}
                            disabled={isloading}
                            className={Styles.submitBtn}
                        >
                            {isloading ? "Sending OTP..." : "Send Verification OTP"}
                        </button>
                    </div>
                )}

                {isemailpresent && !isemailverified && (
                    <div className={Styles.card}>
                        <div className={Styles.verifyIcon}>
                            <i className="fa-solid fa-key"></i>
                        </div>
                        <div className={Styles.cardHeader}>
                            <h1>Enter 6-Digit OTP</h1>
                            <p>Enter the verification code sent to <strong>{email}</strong></p>
                        </div>
                        <div className={Styles.devHint}>
                            <i className="fa-solid fa-code"></i> Local Dev Mode: Code is also printed in the backend terminal!
                        </div>
                        <div className={Styles.otpcontainer}>
                            {otp.map((value, index) => (
                                <input
                                    key={index}
                                    id={`reset-otp-${index}`}
                                    inputMode="numeric"
                                    maxLength={1}
                                    placeholder="-"
                                    value={value}
                                    autoComplete="off"
                                    type="text"
                                    className={Styles.otpinp}
                                    onChange={(e) => handleInput(index, e)}
                                    onKeyDown={(e) => handlebck(index, e)}
                                />
                            ))}
                        </div>
                        <button
                            onClick={verifyprocess}
                            className={Styles.submitBtn}
                            disabled={isloading}
                        >
                            {isloading ? "Verifying..." : "Verify Code"}
                        </button>
                    </div>
                )}

                {isemailpresent && isemailverified && (
                    <div className={Styles.card}>
                        <div className={Styles.cardHeader}>
                            <h1>Create New Password</h1>
                            <p>Choose a secure password with at least 6 characters</p>
                        </div>
                        <div className={Styles.inputField}>
                            <label>New Password</label>
                            <div className={Styles.passdiv}>
                                <input
                                    onChange={(event) => setnewpassword(event.target.value)}
                                    type={showpass ? "text" : "password"}
                                    value={newpassword}
                                    placeholder="••••••••"
                                />
                                <i
                                    className={`fa-solid ${showpass ? "fa-eye-slash" : "fa-eye"}`}
                                    onClick={() => setshowpass(!showpass)}
                                ></i>
                            </div>
                        </div>

                        <div className={Styles.inputField}>
                            <label>Confirm Password</label>
                            <div className={Styles.passdiv}>
                                <input
                                    type={showconfirmpass ? "text" : "password"}
                                    value={confirmpassword}
                                    onChange={(event) => setconfirmpassword(event.target.value)}
                                    placeholder="••••••••"
                                />
                                <i
                                    className={`fa-solid ${showconfirmpass ? "fa-eye-slash" : "fa-eye"}`}
                                    onClick={() => setshowconfirmpass(!showconfirmpass)}
                                ></i>
                            </div>
                        </div>

                        <button
                            onClick={resetpasswordsent}
                            disabled={isloading}
                            className={Styles.submitBtn}
                        >
                            {isloading ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Forgotpassword;
