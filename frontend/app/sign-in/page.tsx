// // app/sign-in/page.tsx
// import { AuthForm } from '../(components)/auth/AuthForm';
// import { Metadata } from 'next';
// import { headers } from 'next/headers';

// export const metadata: Metadata = {
//     title: 'Sign in',
//     description: 'Sign in to your account',
// }
// export default function Page() {

//     const headersList = headers();
//     const referer = headersList.get('referer') || ""; // Get origin, check if null
//     let redirectUrl = "/";
//     if(referer){
//         const url = new URL(referer);
//         const callbackUrl = url.searchParams.get("redirect");
//         if(callbackUrl){
//             redirectUrl = callbackUrl;
//         }
//     }

//   return (
//     <div className="flex items-center justify-center h-screen bg-[#09090b]">
//       <AuthForm redirect={redirectUrl}/>
//     </div>
//   );
// }
// app/sign-in/page.tsx
"use client"
import { AuthForm } from '../(components)/auth/AuthForm';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation'; // Import the redirect function
import { useSearchParams } from 'next/navigation'

// export const metadata: Metadata = {
//     title: 'Sign in',
//     description: 'Sign in to your account',
// }
export default function Page() {

    // const headersList = headers();
    // const referer = headersList.get('referer') || ""; // Get origin, check if null
    // let redirectUrl = "/";
    // if(referer){
    //     const url = new URL(referer);
    //     const callbackUrl = url.searchParams.get("redirect");
    //     if(callbackUrl){
    //         redirectUrl = callbackUrl;
    //     }
    // }
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get('redirect') || "/" //Using params

  return (
    <div className="flex items-center justify-center h-screen bg-[#09090b]">
      <AuthForm redirect={redirectUrl}/>
    </div>
  );
}