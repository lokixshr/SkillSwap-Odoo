import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface AuthFormProps {
  type: "login" | "signup";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle form submission here
      console.log("Form submitted:", formData);
      
      // Redirect after successful submission
      if (isLogin) {
        navigate("/dashboard"); // Or wherever authenticated users should go
      } else {
        navigate("/onboarding"); // New users go to onboarding
      }
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
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <Button type="submit" className="w-full btn-hero">
                {isLogin ? "Sign In" : "Create Account"}
              </Button>

              {isLogin && (
                <div className="text-center">
                  <Link 
                    to="#" 
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    Forgot your password?
                  </Link>
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