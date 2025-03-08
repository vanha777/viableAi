'use client'
import SimpleNavBar from "@/app/dashboard/components/simpleNavBar";
import SimpleSideBar from "@/app/dashboard/components/simpleSideBar";
import WebhookSection from "./WebhookSection";

export default function Main() {
    return (
        <>
            <SimpleSideBar>
                {/* <SimpleNavBar /> */}
                {/* <div className="container mx-auto py-28 overflow-y-auto"> */}
                    {/* <OfferCard /> */}
                    <WebhookSection />
                {/* </div> */}
            </SimpleSideBar>
        </>
    );
}