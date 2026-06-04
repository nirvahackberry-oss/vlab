import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck, CheckCircle2, EyeOff, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { sleep, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const formSchema = z.object({
  role: z.enum(['student', 'faculty', 'tenant_user', 'tenant_admin'], { required_error: 'Please select an account type' }),
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().min(10, 'Mobile Number must be at least 10 digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
  
  // Student fields
  program: z.string().optional(),
  semester: z.string().optional(),
  enrollmentNumber: z.string().optional(),
  studentCollege: z.string().optional(),
  
  // Faculty fields
  department: z.string().optional(),
  facultyDesignation: z.string().optional(),
  facultyCollege: z.string().optional(),
  facultyId: z.string().optional(),
  
  // Tenant User fields
  userOrgName: z.string().optional(),
  userDepartment: z.string().optional(),
  employeeId: z.string().optional(),
  
  // Tenant Admin fields
  adminOrgName: z.string().optional(),
  adminOrgEmail: z.string().optional(),
  adminOrgContact: z.string().optional(),
  adminDesignation: z.string().optional(),
  
  // Terms
  agreeTerms: z.boolean().refine(val => val === true, 'You must agree to the Terms & Conditions and Privacy Policy'),
  receiveUpdates: z.boolean().optional().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
}).superRefine((data, ctx) => {
  if (data.role === 'student') {
    if (!data.program) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Program is required", path: ['program'] });
    if (!data.semester) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Semester is required", path: ['semester'] });
    if (!data.enrollmentNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enrollment Number is required", path: ['enrollmentNumber'] });
    if (!data.studentCollege) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "College Name is required", path: ['studentCollege'] });
  }
  if (data.role === 'faculty') {
    if (!data.department) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Department is required", path: ['department'] });
    if (!data.facultyDesignation) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Designation is required", path: ['facultyDesignation'] });
    if (!data.facultyCollege) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "College Name is required", path: ['facultyCollege'] });
    if (!data.facultyId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Faculty ID is required", path: ['facultyId'] });
  }
  if (data.role === 'tenant_user') {
    if (!data.userOrgName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Organization Name is required", path: ['userOrgName'] });
  }
  if (data.role === 'tenant_admin') {
    if (!data.adminOrgName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Organization Name is required", path: ['adminOrgName'] });
    if (!data.adminOrgEmail) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Organization Email is required", path: ['adminOrgEmail'] });
    if (!data.adminOrgContact) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Organization Contact is required", path: ['adminOrgContact'] });
    if (!data.adminDesignation) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Designation is required", path: ['adminDesignation'] });
  }
});

const ROLE_DESCRIPTIONS: Record<string, string> = {
  student: "Access assigned labs and track learning progress.",
  faculty: "Create and manage virtual labs for students.",
  tenant_user: "Manage assigned labs and credits.",
  tenant_admin: "Manage users, credits, courses and reports."
}

export function SignUpForm({
  className,
  redirectTo,
  ...props
}: React.HTMLAttributes<HTMLFormElement> & { redirectTo?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
      receiveUpdates: false,
    },
  })

  const watchRole = form.watch('role')
  const watchPassword = form.watch('password') || ''

  const passwordReqs = [
    { regex: /[A-Z]/, label: 'Uppercase' },
    { regex: /[a-z]/, label: 'Lowercase' },
    { regex: /[0-9]/, label: 'Number' },
    { regex: /[^A-Za-z0-9]/, label: 'Special' },
    { regex: /.{8,}/, label: '8+ Chars' },
  ]

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    // Simulate API call
    await sleep(1500)
    
    setIsLoading(false)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
          <MailCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">Account Created Successfully</h3>
          <p className="text-slate-500 font-medium max-w-[300px]">
            Please verify your email before logging in. We've sent a verification link to your email address.
          </p>
        </div>
        <div className="w-full space-y-3 pt-4">
          <Button className="w-full bg-[#dc2626] hover:bg-[#dc2626]/90 text-white" onClick={() => window.location.href = '/sign-in'}>
            Go To Login
          </Button>
          <Button variant="outline" className="w-full" onClick={() => toast.success('Verification email sent!')}>
            Resend Verification Email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3 relative', className)}
        {...props}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="tenant_user">Tenant User</SelectItem>
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  </SelectContent>
                </Select>
                {watchRole && (
                  <FormDescription className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    {ROLE_DESCRIPTIONS[watchRole]}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Profile Photo */}
        <div className="space-y-1.5">
          <FormLabel>Profile Photo Upload</FormLabel>
          <Input type="file" accept="image/*" className="cursor-pointer file:cursor-pointer file:bg-slate-100 file:border-0 file:rounded-sm file:px-2 file:py-0.5 file:mr-2 file:text-xs text-xs h-8 hover:file:bg-slate-200" />
        </div>

        {/* ROLE SPECIFIC FIELDS */}
        {watchRole && (
          <div className="space-y-3 p-3 bg-white border border-slate-200 shadow-sm rounded-md animate-in fade-in zoom-in-95 duration-200">
            <h4 className="font-semibold text-xs text-slate-800 uppercase tracking-wider">{watchRole.replace('_', ' ')} Details</h4>
            
            {watchRole === 'student' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="MCA">MCA</SelectItem>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="B.Tech">B.Tech</SelectItem>
                            <SelectItem value="M.Tech">M.Tech</SelectItem>
                            <SelectItem value="B.Sc IT">B.Sc IT</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Semester 1">Semester 1</SelectItem>
                            <SelectItem value="Semester 2">Semester 2</SelectItem>
                            <SelectItem value="Semester 3">Semester 3</SelectItem>
                            <SelectItem value="Semester 4">Semester 4</SelectItem>
                            <SelectItem value="Semester 5">Semester 5</SelectItem>
                            <SelectItem value="Semester 6">Semester 6</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="enrollmentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="E.g. EN123456" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentCollege"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="University Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {watchRole === 'faculty' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="E.g. CS" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facultyDesignation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="E.g. Professor" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="facultyCollege"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="University Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facultyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faculty ID <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="E.g. FAC9876" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {watchRole === 'tenant_user' && (
              <>
                <FormField
                  control={form.control}
                  name="userOrgName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="Company Name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="userDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl><Input placeholder="E.g. Engineering" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID</FormLabel>
                        <FormControl><Input placeholder="E.g. EMP123" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {watchRole === 'tenant_admin' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="adminOrgName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Company Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminDesignation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="E.g. IT Director" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="adminOrgEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="admin@company.com" type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminOrgContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Contact <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="********" type={showPassword ? 'text' : 'password'} {...field} />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="********" type={showConfirmPassword ? 'text' : 'password'} {...field} />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Password Strength Meter - Horizontal layout */}
        {watchPassword && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px]">
            {passwordReqs.map((req, i) => (
              <div key={i} className="flex items-center gap-1">
                {req.regex.test(watchPassword) ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className={req.regex.test(watchPassword) ? "text-slate-700" : "text-slate-400"}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-1">
          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5 data-[state=checked]:bg-[#dc2626] data-[state=checked]:border-[#dc2626]" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[13px] font-medium text-slate-700">
                    I agree to the Terms & Conditions and Privacy Policy.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="receiveUpdates"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5 data-[state=checked]:bg-[#dc2626] data-[state=checked]:border-[#dc2626]" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-[13px] font-medium text-slate-700">
                    Receive platform updates.
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Sticky Action Area */}
        <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-2 border-t border-slate-100 flex flex-col gap-3">
          <Button className="w-full bg-[#dc2626] hover:bg-[#dc2626]/90 text-white h-11 text-base font-semibold shadow-md shadow-red-500/20" disabled={isLoading || isSuccess}>
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Create Account
          </Button>
          <div className="text-center text-sm text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/sign-in" className="font-bold text-[#dc2626] hover:text-[#dc2626]/80 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
