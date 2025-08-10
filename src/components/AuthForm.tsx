import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { UserService } from "@/lib/database";

interface AuthFormProps {
  type: "login" | "signup";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLogin = type === "login";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!formData.firstName) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName) {
        newErrors.lastName = "Last name is required";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user profile
      await UserService.createOrUpdateUser(result.user, {
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
      });
      
      toast({
        title: "Welcome to SkillSwap!",
        description: "Successfully signed in with Google.",
      });
      
      // Navigate to onboarding for new users, dashboard for existing
      navigate("/onboarding");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (isLogin) {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/dashboard");
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Create user profile
        await UserService.createOrUpdateUser(userCredential.user, {
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        
        navigate("/onboarding");
      }
    } catch (error: any) {
      let errorMessage = "Authentication failed.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password.";
      }
      
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center subtle-gradient px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to SkillSwap
          </Link>
        </div>

        <Card className="shadow-xl border-border/50 bg-card/80 backdrop-blur-sm hover-lift">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-foreground">
              {isLogin ? "Welcome Back" : "Join SkillSwap"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? "Sign in to continue your learning journey" 
                : "Create your account to start sharing and learning skills"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-6">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange("firstName")}
                      className={`transition-all duration-300 ${errors.firstName ? 'border-destructive' : ''}`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive animate-in slide-in-from-top-2 duration-200">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange("lastName")}
                      className={`transition-all duration-300 ${errors.lastName ? 'border-destructive' : ''}`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive animate-in slide-in-from-top-2 duration-200">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  className={`transition-all duration-300 ${errors.email ? 'border-destructive' : ''}`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-2 duration-200">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className={`pr-10 transition-all duration-300 ${errors.password ? 'border-destructive' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-2 duration-200">
                    {errors.password}
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    className={`transition-all duration-300 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive animate-in slide-in-from-top-2 duration-200">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              {isLogin && (
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link 
                  to={isLogin ? "/signup" : "/login"} 
                  className="text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;