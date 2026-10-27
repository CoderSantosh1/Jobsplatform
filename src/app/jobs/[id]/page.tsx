import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { faqJsonLd } from "@/lib/faq";
import JsonLd from "@/components/seo/JsonLd";
import PostFooter from "@/components/seo/PostFooter";
import { getDetail, getLatest, getRelated } from "@/lib/content";
import { getTestLinks } from "@/lib/quizzes";
import { detailMetadata } from "@/lib/seo-server";
import { detailSegment } from "@/lib/slug";
import { SITE_NAME, SITE_URL, clip, displayDate, formatDate, isBlank, isPastDeadline, parseDate } from "@/lib/seo";

// Pages are built on first request and refreshed every 5 minutes.
export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return detailMetadata("jobs", (await params).id);
}

function Row({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  if (isBlank(value)) return null;
  return (
    <li>
      <span className="font-semibold">{label}:</span>{" "}
      <span className={highlight ? "text-red-600 font-semibold" : "text-blue-800"}>{value}</span>
    </li>
  );
}

/** Non-empty lines of a multi-line admin field (selection process, syllabus). */
function lines(value?: string | null): string[] {
  return isBlank(value) ? [] : String(value).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function withRupee(fee?: string) {
  if (isBlank(fee)) return undefined;
  const text = String(fee).trim();
  return /^\d+$/.test(text) ? `₹${text}/-` : text;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getDetail("jobs", id);
  if (!job) notFound();
  const segment = detailSegment(job);
  if (decodeURIComponent(id) !== segment) permanentRedirect(`/jobs/${segment}`);

  const [related, latest, testLinks] = await Promise.all([
    getRelated("jobs", job),
    getLatest("jobs", job._id),
    getTestLinks(job.title),
  ]);

  const lastDate = displayDate(job.lastDateApplyOnline) || displayDate(job.applicationDeadline);
  const deadline = parseDate(job.lastDateApplyOnline) ?? parseDate(job.applicationDeadline);
  const expired = isPastDeadline(deadline);
  const requirements: string[] = (Array.isArray(job.requirements) ? job.requirements : [job.requirements]).filter(
    (r: unknown) => !isBlank(r),
  );
  const selectionSteps = lines(job.selectionProcess);
  const syllabusItems = lines(job.syllabus);
  const officialSite = isBlank(job.officialWebsite) ? job.applyJob : job.officialWebsite;
  const notificationLink = isBlank(job.officialNotificationLink) ? undefined : job.officialNotificationLink;
  const verifiedOn = job.lastVerifiedAt ? formatDate(job.lastVerifiedAt) : null;
  const feeGeneral = withRupee(job.applicationFeeGeneral);
  const feeReserved = withRupee(job.applicationFeeSCST);
  const ageRange =
    !isBlank(job.minimumAge) || !isBlank(job.maximumAge)
      ? [!isBlank(job.minimumAge) && `${job.minimumAge} years (min)`, !isBlank(job.maximumAge) && `${job.maximumAge} years (max)`]
          .filter(Boolean)
          .join(" – ")
      : undefined;

  const faqs = [
    lastDate && { q: `What is the last date to apply for ${job.title}?`, a: `The last date to apply online is ${lastDate}.` },
    !isBlank(job.totalVacancy) && { q: `How many vacancies are there?`, a: `${job.organization} has announced ${job.totalVacancy} posts.` },
    ageRange && { q: "What is the age limit?", a: `Age limit: ${ageRange}. Age relaxation applies as per the official notification.` },
    !isBlank(job.qualification) && { q: "What qualification is required?", a: String(job.qualification) },
    (feeGeneral || feeReserved) && {
      q: "What is the application fee?",
      a: [feeGeneral && `General / OBC / EWS: ${feeGeneral}`, feeReserved && `SC / ST / Female: ${feeReserved}`].filter(Boolean).join("; ") + ".",
    },
  ].filter(Boolean) as { q: string; a: string }[];

  const datePosted = new Date(job.createdAt ?? Date.now());
  const validThrough = deadline;
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: (job.description || job.title).replace(/\n/g, "<br>"),
    datePosted: datePosted.toISOString(),
    ...(validThrough && { validThrough: validThrough.toISOString() }),
    employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: job.organization, ...(job.applyJob && { sameAs: job.applyJob }) },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.location || "India", addressCountry: "IN" },
    },
    ...(!isBlank(job.totalVacancy) && { totalJobOpenings: Number(job.totalVacancy) || undefined }),
    ...(!isBlank(job.qualification) && { educationRequirements: job.qualification }),
    directApply: false,
    identifier: { "@type": "PropertyValue", name: SITE_NAME, value: job._id },
    url: `${SITE_URL}/jobs/${segment}`,
  };

  const linkRow = "flex justify-between gap-4 px-4 py-3 border-b last:border-b-0";

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <article className="max-w-5xl mx-auto bg-white shadow-lg p-4 md:p-6">
          <Breadcrumbs items={[{ name: "Latest Jobs", href: "/jobs" }, { name: job.title, href: `/jobs/${segment}` }]} />
          {!expired && <JsonLd data={jobPosting} />}

          <h1 className="text-2xl md:text-3xl font-bold text-red-800">{job.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {expired ? (
              <span className="rounded bg-red-600 px-2 py-0.5 font-bold uppercase tracking-wide text-white">Expired · Application closed</span>
            ) : (
              <span className="rounded bg-green-600 px-2 py-0.5 font-bold uppercase tracking-wide text-white">Apply online open</span>
            )}
            {verifiedOn && (
              <span className="rounded border border-green-600 px-2 py-0.5 text-green-800">
                Last verified with official notification: <time dateTime={new Date(job.lastVerifiedAt).toISOString()}>{verifiedOn}</time>
              </span>
            )}
            {officialSite && (
              <a href={officialSite} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 hover:underline">
                Official source
              </a>
            )}
          </div>
          <p className="mt-1 text-gray-700">
            {job.organization}
            {!isBlank(job.location) && ` · ${job.location}`}
            {!isBlank(job.totalVacancy) && ` · ${job.totalVacancy} Posts`}
          </p>
          {expired && (
            <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
              Application closed: the last date ({lastDate}) has passed. This page is kept for reference; check the
              related updates below for the admit card, answer key and result.
            </p>
          )}

          {!isBlank(job.description) && <p className="mt-4 text-gray-800 whitespace-pre-line">{job.description}</p>}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section className="border border-blue-700 p-4">
              <h2 className="font-bold text-red-900 mb-2">Important Dates</h2>
              <ul className="space-y-1 text-sm">
                <Row label="Application Begin" value={displayDate(job.applicationBeginDate)} />
                <Row label="Last Date to Apply Online" value={lastDate} highlight />
                <Row label="Last Date to Pay Fee" value={displayDate(job.formCompleteLastDate)} />
                <Row label="Correction Date" value={displayDate(job.correctionDate)} />
                <Row label="Exam Date" value={displayDate(job.examDate)} />
                <Row label="Admit Card" value={displayDate(job.admitCardDate)} />
              </ul>
            </section>

            {(feeGeneral || feeReserved || !isBlank(job.paymentMethod)) && (
              <section className="border border-blue-700 p-4">
                <h2 className="font-bold text-red-900 mb-2">Application Fee</h2>
                <ul className="space-y-1 text-sm">
                  <Row label="General / OBC / EWS" value={feeGeneral} />
                  <Row label="SC / ST / Female" value={feeReserved} />
                  <Row label="Payment Mode" value={job.paymentMethod} />
                </ul>
              </section>
            )}

            <section className="border border-blue-700 p-4">
              <h2 className="font-bold text-red-900 mb-2">Age Limit &amp; Eligibility</h2>
              <ul className="space-y-1 text-sm">
                <Row label="Minimum Age" value={isBlank(job.minimumAge) ? undefined : `${job.minimumAge} Years`} />
                <Row label="Maximum Age" value={isBlank(job.maximumAge) ? undefined : `${job.maximumAge} Years`} />
                <Row label="Gender" value={job.gender} />
                <Row label="Qualification" value={job.qualification} />
              </ul>
              {requirements.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                  {requirements.map((r, i) => (
                    <li key={i} className="whitespace-pre-line">{r}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border border-blue-700 p-4">
              <h2 className="font-bold text-red-900 mb-2">Vacancy &amp; Salary</h2>
              <ul className="space-y-1 text-sm">
                <Row label="Total Vacancy" value={job.totalVacancy} />
                <Row label="Salary / Pay Scale" value={job.salary} />
                <Row label="Job Location" value={job.location} />
              </ul>
            </section>
          </div>

          {(selectionSteps.length > 0 || syllabusItems.length > 0) && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {selectionSteps.length > 0 && (
                <section className="border border-blue-700 p-4">
                  <h2 className="font-bold text-red-900 mb-2">Selection Process</h2>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    {selectionSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}
              {syllabusItems.length > 0 && (
                <section className="border border-blue-700 p-4">
                  <h2 className="font-bold text-red-900 mb-2">Syllabus &amp; Exam Pattern</h2>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {syllabusItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-600">Check the full syllabus in the official notification.</p>
                </section>
              )}
            </div>
          )}

          <section className="mt-5">
            <h2 className="text-lg font-bold text-red-800 mb-2">How to Apply for {clip(job.title, 80)}</h2>
            <ol className="list-decimal pl-6 space-y-1 text-gray-800">
              <li>Read the official notification and check that you meet the eligibility and age limit.</li>
              <li>Open the &quot;Apply Online&quot; link below and register with your mobile number and email.</li>
              <li>Fill in the application form and upload your photo, signature and documents.</li>
              <li>Pay the application fee (if applicable) and submit the form{lastDate ? ` before ${lastDate}` : ""}.</li>
              <li>Download and keep a printout of the submitted form for future reference.</li>
            </ol>
          </section>

          {(job.applyJob || notificationLink || officialSite) && (
            <section className="mt-5 border border-gray-300 rounded">
              <h2 className="text-center text-xl font-bold text-green-700 py-3 border-b">Important Links</h2>
              {job.applyJob && (
                <div className={linkRow}>
                  <span className="font-semibold text-fuchsia-700">Apply Online</span>
                  <a href={job.applyJob} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 font-semibold hover:underline">
                    {expired ? "Application closed" : `Apply for ${clip(job.title, 40)}`}
                  </a>
                </div>
              )}
              {notificationLink && (
                <div className={linkRow}>
                  <span className="font-semibold text-fuchsia-700">Official Notification (PDF)</span>
                  <a href={notificationLink} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 font-semibold hover:underline">
                    Download notification
                  </a>
                </div>
              )}
              {officialSite && (
                <div className={linkRow}>
                  <span className="font-semibold text-fuchsia-700">{notificationLink ? "Official Website" : "Official Notification / Website"}</span>
                  <a href={officialSite} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 font-semibold hover:underline">
                    {job.organization} official website
                  </a>
                </div>
              )}
            </section>
          )}

          {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)!} />}
          {faqs.length > 0 && (
            <section className="mt-5">
              <h2 className="text-lg font-bold text-red-800 mb-2">Frequently Asked Questions</h2>
              <dl className="space-y-3">
                {faqs.map((f) => (
                  <div key={f.q}>
                    <dt className="font-semibold">{f.q}</dt>
                    <dd className="text-gray-800">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <PostFooter
            updatedAt={job.updatedAt ?? job.createdAt}
            officialUrl={officialSite}
            related={related}
            testLinks={testLinks}
            latest={latest}
            latestTitle="More Latest Jobs"
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
