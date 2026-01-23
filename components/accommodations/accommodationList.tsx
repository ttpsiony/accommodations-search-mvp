"use client";

import type { Stay } from "@/helpers/accommodations";

type AccommodationListProps = {
  stays: Stay[];
};

type AccommodationCardProps = {
  stay: Stay;
};

function AccommodationCard({ stay }: AccommodationCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{stay.name}</h3>
          <p className="text-sm text-slate-500">{stay.typeLabel}</p>
          {stay.formattedAddress ? (
            <p className="text-xs text-slate-400">地址：{stay.formattedAddress}</p>
          ) : null}
          {stay.editorialSummary ? (
            <p className="mt-1 text-xs text-slate-500">{stay.editorialSummary}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">
          {stay.rating.toFixed(1)}
        </span>
        {stay.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-amber-100 px-2.5 py-1 text-slate-700">
            {tag}
          </span>
        ))}
        {stay.allowsDogs && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-slate-700">
            寵物友善
          </span>
        )}
        {stay.goodForChildren && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-slate-700">
            兒童友善
          </span>
        )}
      </div>
      {(stay.acceptsCashOnly || stay.acceptsCreditCards || stay.acceptsDebitCards) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-xs font-semibold text-slate-500">接受付款方式</span>
          {stay.acceptsCashOnly && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              僅收現金
            </span>
          )}
          {stay.acceptsCreditCards && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              信用卡
            </span>
          )}
          {stay.acceptsDebitCards && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              金融卡
            </span>
          )}
        </div>
      )}
    </article>
  );
}

export default function AccommodationList({ stays }: AccommodationListProps) {
  if (stays.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
        尚無符合條件的住宿，請調整座標、半徑或篩選條件。
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {stays.map((stay) => (
        <AccommodationCard key={stay.id} stay={stay} />
      ))}
    </div>
  );
}
