import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile,
  signInWithRedirect
} from "firebase/auth";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setErrorMsg("Please enter your name.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        localStorage.setItem("temp_register_username", username.trim());
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: username.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setErrorMsg(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      console.log("Attempting Google sign-in via popup...");
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn("Google Sign-In popup failed, trying redirect mode...", err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error("Google Sign-In redirect failed too:", redirectErr);
        setErrorMsg(redirectErr.message.replace("Firebase: ", ""));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page-container bg-grid">
      <main className="login-card-wrapper-simple" data-purpose="auth-container">
        <section className="login-form-section" data-purpose="auth-form">
          <div className="login-logo-header">
            <h1 className="login-title">GATE CSE <span className="text-brand-cyan">2027</span></h1>
          </div>

          <header className="login-subheader">
            <h2>{isSignUp ? "Create an Account" : "Welcome Back"}</h2>
            <p>{isSignUp ? "Sign up to get started" : "Please enter your details to sign in"}</p>
          </header>

          <form onSubmit={handleEmailAuth} className="login-form-simple">
            {isSignUp && (
              <div className="form-group-simple">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="auth-input-simple"
                  placeholder="John Doe"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group-simple">
              <label>Email Address</label>
              <input 
                type="email" 
                className="auth-input-simple"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group-simple">
              <label>Password</label>
              <div className="relative-container">
                <span className="input-prefix-icon">
                  <svg className="icon-svg" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" fillRule="evenodd"></path>
                  </svg>
                </span>
                <input 
                  type="password" 
                  className="auth-input-simple pr-icon"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="login-error-message">
                <span className="material-symbols-outlined">warning</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="login-submit-btn-simple" 
              disabled={loading}
            >
              <svg className="icon-svg" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" fillRule="evenodd"></path>
              </svg>
              <span>{loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}</span>
            </button>
          </form>

          <button 
            type="button" 
            className="google-signin-btn" 
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg className="google-icon-svg" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{isSignUp ? "Sign up with Google" : "Sign in with Google"}</span>
          </button>



          <footer className="login-footer-simple">
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button 
                type="button"
                className="mode-toggle-link-simple" 
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
