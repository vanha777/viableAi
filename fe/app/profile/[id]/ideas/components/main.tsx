'use client'
import SimpleNavBar from "@/app/dashboard/components/simpleNavBar";
import SimpleSideBar from "@/app/dashboard/components/simpleSideBar";
import IdeaCard from "./ideaCard";

export default function Main() {
    return (
        <>
            <SimpleSideBar>
                {/* <SimpleNavBar /> */}
                {/* <div className="container mx-auto py-28 overflow-y-auto"> */}
                    <IdeaCard />
                {/* </div> */}
            </SimpleSideBar>
        </>
    );
}