import { allAcademyCourses } from "@/lib/academy";

export default function AcademyCourses({ category = "hair" }: { category?: "hair" | "nails" }) {
  const courses = allAcademyCourses.filter(course => course.category === category);
  return <div className={`academy-course-options${category === "nails" ? " academy-nail-options" : ""}`} aria-label={`${category === "hair" ? "Hairstyling" : "Nail"} courses`}>
    {courses.map((item, index) => <article key={item.slug} className="academy-course-card">
      <div className="academy-card-heading">
        <p className="academy-card-level">{category === "hair" ? "Professional hairstyling" : ["Basic", "Professional", "Master"][index]}</p>
        <h3>{item.title}</h3>
        <p className="academy-card-price">NPR {item.price.toLocaleString("en-US")}</p>
        <span className="academy-price-note">Temporary course fee</span>
      </div>
      <div className="academy-card-row"><span>Duration</span><strong>{item.days} days</strong></div>
      <div className="academy-card-row"><span>Curriculum</span><strong>{item.lessons.length} {category === "hair" ? "daily lessons" : "topics"}</strong></div>
      <div className="academy-card-action"><a className="academy-course-details" href={`/academy/${item.slug}`}>View curriculum</a><a className="academy-course-details" href={`/academy/${item.slug}/register`}>Enroll now</a></div>
    </article>)}
  </div>;
}
