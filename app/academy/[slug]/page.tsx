import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allAcademyCourses, findAcademyCourse } from "@/lib/academy";
import AcademyHeader from "@/components/academy-header";
import SiteFooter from "@/components/site-footer";

export function generateStaticParams() { return allAcademyCourses.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const course = findAcademyCourse((await params).slug);
  return { title: course ? `${course.title} | Usha Academy` : "Usha Academy" };
}
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const course = findAcademyCourse((await params).slug);
  if (!course) notFound();
  return <main className="academy-page academy-course-page">
    <AcademyHeader />
    <div className="academy-content">
      <a className="academy-back" href="/academy">← All courses</a>
      <section className="academy-intro"><p className="academy-eyebrow">Usha Academy</p><h1>{course.title}</h1></section>
      <section className="academy-curriculum" aria-labelledby="course-curriculum-title">
        <div className="academy-curriculum-heading"><div><p className="academy-eyebrow">What you will learn</p><h2 id="course-curriculum-title">Course curriculum</h2></div><span className="academy-day-count">{course.days} days</span></div>
        <ol className="academy-lesson-list">{course.lessons.map((lesson, index) => <li key={index}><span className="academy-lesson-day">{course.category === "hair" ? `Day ${index + 1}` : String(index + 1).padStart(2, "0")}</span><span>{lesson}</span></li>)}</ol>
      </section>
      <div className="academy-enquiry"><p>Ready to join this course?</p><a href={`/academy/${course.slug}/register`}>Enroll now</a></div>
    </div>
    <SiteFooter currentPage="academy" />
  </main>;
}
