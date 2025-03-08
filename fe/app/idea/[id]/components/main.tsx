'use client'
import { redirect } from "next/navigation";
import IdeaCard, { IdeaProps, OfferProps } from "./ideaCard";
import { Db, Server } from "@/app/utils/db";
import { AppProvider, useAppContext, UserData } from "@/app/utils/AppContext";
import SimpleSideBar from "@/app/dashboard/components/simpleSideBar";
import SimpleNavBar from "@/app/dashboard/components/simpleNavBar";
export default async function Main({ parsedIdea }: { parsedIdea: IdeaProps }) {
//     console.log('Path ID:', params.id);
//     // fetch idea from supabase with related data
//     const { data: ideaData, error: ideaError } = await Db
//         .from('ideas')
//         .select(`
//       *,
//       address_detail!inner (*)
//     `)
//         .eq('id', params.id)
//         .limit(1).single();

//     if (!ideaData || ideaData.length === 0) {
//         console.log("ideaData not found");
//         redirect('/not-found');
//     }
//     const { data: offersData, error: offerError } = await Db
//         .from('offers')
//         .select(`
//     *
//   `)
//         .eq('idea_id', params.id)
//         .limit(1).single();
//     let parsedIdea = JSON.parse(JSON.stringify(ideaData)) as IdeaProps;
//     if (offersData) {
//         parsedIdea.offer = JSON.parse(JSON.stringify(offersData)) as OfferProps;
//     }
//     console.log("parsedIdea", parsedIdea);
    return (
        <>
            <SimpleSideBar>
                {/* <SimpleNavBar /> */}
                <div className="container overflow-y-auto">
                    <IdeaCard
                        idea={parsedIdea as IdeaProps}
                    />
                </div>
            </SimpleSideBar>
        </>

    );
}
