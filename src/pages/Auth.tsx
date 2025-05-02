
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";

interface AuthFormValues {
  email: string;
  password: string;
}

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // If user is already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      navigate("/");
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
    } catch (error) {
      console.error("Error signing up:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-muted/10">
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-brand"></div>
            <h1 className="text-2xl font-bold">MetaMinds</h1>
          </div>
          <p className="text-muted-foreground">
            Sign in to continue to MetaMinds platform
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <SignInForm onSubmit={handleSignIn} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignUpForm onSubmit={handleSignUp} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SignInForm({ onSubmit, isLoading }: { onSubmit: (data: AuthFormValues) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>();
  
  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="me@example.com"
              {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })} 
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button variant="link" className="p-0 h-auto" type="button">Forgot password?</Button>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })} 
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SignUpForm({ onSubmit, isLoading }: { onSubmit: (data: AuthFormValues) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>();

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input 
              id="signup-email" 
              type="email" 
              placeholder="me@example.com"
              {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })} 
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input 
              id="signup-password" 
              type="password" 
              placeholder="••••••••"
              {...register("password", { 
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" } 
              })} 
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
