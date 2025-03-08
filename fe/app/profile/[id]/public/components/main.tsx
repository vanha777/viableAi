'use client'
import SimpleNavBar from "@/app/dashboard/components/simpleNavBar";
import SimpleSideBar from "@/app/dashboard/components/simpleSideBar";
import SettingsSection from "./SettingsSection";

export default function Main({ user_id }: { user_id: string }) {
    return (
        <>
            <SimpleSideBar>
                {/* <SimpleNavBar /> */}
                {/* <div className="container mx-auto py-28 overflow-y-auto"> */}
                    <SettingsSection user_id={user_id} />
                {/* </div> */}
            </SimpleSideBar>
        </>
    );
}