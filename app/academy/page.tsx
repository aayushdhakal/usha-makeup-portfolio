import AcademyHeader from "@/components/academy-header";
import type { Metadata } from "next";
import AcademyCourses from "@/components/academy-courses";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Academy | Usha Makeup and Nails",
  description: "Explore professional hairstyling classes and Basic, Professional, and Master Nails courses at Usha Academy.",
};

export default function AcademyPage() {
  return <main className="academy-page">
    <AcademyHeader />
    <div className="academy-content">
      <section className="academy-intro" aria-labelledby="academy-title">
        <h1 id="academy-title">Explore our professional makeup, hairstyling and nail courses.</h1>
      </section>
      <section className="academy-course-group" aria-labelledby="academy-hair-title">
        <h2 id="academy-hair-title" className="academy-group-title">Professional Hairstyling Classes</h2>
        <AcademyCourses />
      </section>
      <section className="academy-course-group" aria-labelledby="academy-nails-title">
        <h2 id="academy-nails-title" className="academy-group-title">Nails Courses</h2>
        <AcademyCourses category="nails" />
      </section>
    </div>
    <SiteFooter currentPage="academy" />
  </main>;
}
