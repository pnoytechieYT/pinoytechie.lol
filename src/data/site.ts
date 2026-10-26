
import { Gift, Pen } from "lucide-astro";
interface Referral {
    code: string;
    bonus: string;
    title: string;
    description: string;
    usersCount: number;
}
interface Step {
    number: number;
    title: string;
    description: string;
}
export interface SiteConfig {
    referral: Referral;
    steps: Step[];
}
const referralCode = "MBPINOY2027";
const referralBonus = "₱588";
export const siteData: SiteConfig = {
    referral: {
        code: referralCode,
        bonus: referralBonus,
        title: `MariBank Referral Code: ${referralCode}`,
        description: `Get ${referralBonus} rewards with MariBank referral code ${referralCode}`,
        usersCount: 823, // update as of 10/3/26
    },
    steps: [
        {
            number: 1,
            title: "Download MariBank App",
            description:
                "Download the official MariBank app from Google Play Store or Apple App Store on your smartphone",
        },
        {
            number: 2,
            title: "Sign Up & Enter Code",
            description: `Create your new MariBank account and enter the referral code ${referralCode} during registration to unlock your ${referralBonus} rewards`,
        },
        {
            number: 3,
            title: "Get Your Rewards!",
            description: `Make your first ₱1,000 deposit from any e-wallet, bank, or existing MariBank account and keep it for 3 days to instantly receive your ${referralBonus} rewards`,
        },
    ],
};
