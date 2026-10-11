import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allAcademyCourses, findAcademyCourse } from "@/lib/academy";
import AcademyHeader from "@/components/academy-header";
import CourseRegistration from "@/components/course-registration";
import SiteFooter from "@/components/site-footer";

export function generateStaticParams() { return allAcademyCourses.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const course = findAcademyCourse((await params).slug);
  return { title: course ? `Register for ${course.title} | Usha Academy` : "Usha Academy" };
}
export default async function CourseRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const course = findAcademyCourse((await params).slug);
  if (!course) notFound();
  return <main className="academy-page academy-registration-page">
    <AcademyHeader />
    <div className="academy-content">
      <a className="academy-back" href={`/academy/${course.slug}`}>← Back to course</a>
      <CourseRegistration course={course} />
    </div>
    <SiteFooter currentPage="academy" />
  </main>;
}
