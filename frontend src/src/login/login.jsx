import { useContext, useState, useEffect } from "react";
import Styles from "./login.module.css";
import { toast } from "react-toastify";
import { usercontext } from "../appcontext";
import { useNavigate, Link } from "react-router-dom";
import GoogleButton from "../googlebtn.jsx";

function Login() {
    const navigate = useNavigate();
    const [islogin, setislogin] = useState(true);
    const { backendURL, setisprevious, setusername, setislogged, islogged } = useContext(usercontext);
    const [name, setname] = useState("");
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const [confirmpassword, setconfirmpassword] = useState("");
    const [isloading, setisloading] = useState(false);
    const [isemailverified, setemailverified] = useState(false);
    const [otp, setotp] = useState(["", "", "", "", "", ""]);
    const [showpass, setshowpass] = useState(false);
    const [showconfirmpass, setshowconfirmpass] = useState(false);

    useEffect(() => {
        if (islogged) {
            navigate("/");
        }
    }, [islogged, navigate]);

    function validateEmail(email) {
        const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailregex.test(email);
    }

    const submit = (event) => {
        event.preventDefault();
        if (!islogin) {
            if (name.trim() === "") {
                toast.warn("Username must not be empty");
                return;
            }
            if (email.trim() === "") {
                toast.warn("Email must not be empty");
                return;
            }
            if (!validateEmail(email.trim())) {
                toast.warn("Invalid Email address");
                return;
            }
            if (password.length < 6) {
                toast.warn("Password must have at least 6 characters");
                return;
            }
            if (password !== confirmpassword) {
                toast.warn("Passwords do not match");
                return;
            }
            setisloading(true);
            fetch(`${backendURL}/verifyEmail`, {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: name.trim(), email: email.trim() })
            })
                .then(response => {
                    if (response.ok) {
                        setemailverified(true);
                        toast.info("OTP sent! (Also logged to backend console in dev mode)");
                    } else {
                        toast.error("Email already registered or unavailable");
                    }
                })
                .catch(() => toast.error("Signup network error"))
                .finally(() => setisloading(false));
        } else {
            if (email.trim() === "") {
                toast.warn("Email must not be empty");
                return;
            }
            if (!validateEmail(email.trim())) {
                toast.warn("Invalid Email");
                return;
            }
            if (password.length < 6) {
                toast.warn("Password must have at least 6 characters");
                return;
            }
            setisloading(true);
            fetch(`${backendURL}/login`, {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password: password }),
                credentials: 'include'
            })
                .then(response => {
                    if (response.ok) {
                        toast.success("Successfully logged in");
                        return response.json();
                    } else {
                        toast.error("Invalid email or password");
                        return null;
                    }
                })
                .then(data => {
                    if (data != null) {
                        setislogged(true);
                        setusername(data.username);
                        setisprevious(data.isPrevious);
                        navigate("/");
                    }
                })
                .catch(() => toast.error("Login request failed"))
                .finally(() => setisloading(false));
        }
    };

    function switchmth() {
        setname("");
        setemail("");
        setpassword("");
        setconfirmpassword("");
        setshowpass(false);
        setshowconfirmpass(false);
        setislogin(!islogin);
    }

    const handleInput = (index, event) => {
        const val = event.target.value.replace(/\D/g, "");
        if (val) {
            const tem = [...otp];
            tem[index] = val[val.length - 1];
            setotp(tem);
            if (index < 5) {
                const nextInput = document.getElementById(`otp-input-${index + 1}`);
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
                const prevInput = document.getElementById(`otp-input-${index - 1}`);
                if (prevInput) prevInput.focus();
            }
        }
    };

    const verifyprocess = () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length < 6) {
            toast.error("Please enter the complete 6-digit OTP");
            return;
        }
        setisloading(true);
        fetch(`${backendURL}/register`, {
            method: "post",
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: name.trim(),
                email: email.trim(),
                password: password,
                verifyotp: enteredOtp
            })
        })
            .then(response => {
                if (response.ok) {
                    setotp(["", "", "", "", "", ""]);
                    setname("");
                    setemail("");
                    setpassword("");
                    setconfirmpassword("");
                    toast.success("Account created successfully! Please login.");
                    setemailverified(false);
                    setislogin(true);
                } else {
                    toast.error("Invalid or expired OTP");
                }
            })
            .catch(() => toast.error("Registration failed"))
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
                <button className={Styles.homeBtn} onClick={() => navigate("/")}>
                    <i className="fa-solid fa-house"></i> Home
                </button>
            </header>

            <div className={Styles.cardWrapper}>
                {!isemailverified ? (
                    <div className={Styles.logincontainer}>
                        <div className={Styles.cardHeader}>
                            <h1>{islogin ? "Welcome Back" : "Create Account"}</h1>
                            <p>{islogin ? "Sign in to access your resume analysis dashboard" : "Join to evaluate your resume with Gemini AI"}</p>
                        </div>

                        <form onSubmit={submit} className={Styles.authForm}>
                            {!islogin && (
                                <div className={Styles.inputField}>
                                    <label>Username</label>
                                    <input
                                        onChange={(event) => setname(event.target.value)}
                                        type="text"
                                        maxLength={20}
                                        value={name}
                                        placeholder="John Doe"
                                    />
                                </div>
                            )}

                            <div className={Styles.inputField}>
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    onChange={(event) => setemail(event.target.value)}
                                    value={email}
                                    placeholder="name@company.com"
                                />
                            </div>

                            <div className={Styles.inputField}>
                                <label>Password</label>
                                <div className={Styles.passdiv}>
                                    <input
                                        type={showpass ? "text" : "password"}
                                        onChange={(event) => setpassword(event.target.value)}
                                        value={password}
                                        placeholder="••••••••"
                                    />
                                    <i
                                        className={`fa-solid ${showpass ? "fa-eye-slash" : "fa-eye"}`}
                                        onClick={() => setshowpass(!showpass)}
                                    ></i>
                                </div>
                            </div>

                            {!islogin && (
                                <div className={Styles.inputField}>
                                    <label>Confirm Password</label>
                                    <div className={Styles.passdiv}>
                                        <input
                                            type={showconfirmpass ? "text" : "password"}
                                            onChange={(event) => setconfirmpassword(event.target.value)}
                                            value={confirmpassword}
                                            placeholder="••••••••"
                                        />
                                        <i
                                            className={`fa-solid ${showconfirmpass ? "fa-eye-slash" : "fa-eye"}`}
                                            onClick={() => setshowconfirmpass(!showconfirmpass)}
                                        ></i>
                                    </div>
                                </div>
                            )}

                            {islogin && (
                                <Link className={Styles.linkdis} to={"/forgotpassword"}>
                                    Forgot password?
                                </Link>
                            )}

                            <button
                                type="submit"
                                className={Styles.logincontainerbutton}
                                disabled={isloading}
                            >
                                {isloading ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                                    </>
                                ) : (
                                    islogin ? "Sign In" : "Sign Up & Verify"
                                )}
                            </button>
                        </form>

                        <div className={Styles.switchRow}>
                            <span>{islogin ? "Don't have an account?" : "Already have an account?"}</span>
                            <span className={Styles.logincontainerspan} onClick={switchmth}>
                                {islogin ? "Create Account" : "Sign In"}
                            </span>
                        </div>

                        <div className={Styles.orDivider}>
                            <span>OR</span>
                        </div>

                        <GoogleButton />
                    </div>
                ) : (
                    <div className={Styles.verifycontainer}>
                        <div className={Styles.verifyIcon}>
                            <i className="fa-solid fa-envelope-circle-check"></i>
                        </div>
                        <h1>Verify Your Email</h1>
                        <p>We sent a 6-digit code to <strong>{email}</strong>.</p>
                        <div className={Styles.devHint}>
                            <i className="fa-solid fa-code"></i> Local Dev Mode: Code is also printed in the backend terminal!
                        </div>

                        <div className={Styles.otpcontainer}>
                            {otp.map((value, index) => (
                                <input
                                    key={index}
                                    id={`otp-input-${index}`}
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
                            className={Styles.verbtn}
                            disabled={isloading}
                            onClick={verifyprocess}
                        >
                            {isloading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i> Verifying...
                                </>
                            ) : (
                                "Complete Registration"
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
