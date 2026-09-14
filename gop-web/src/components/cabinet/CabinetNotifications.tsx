import Image from "next/image";
import { MoreHorizontal } from "lucide-react";

import { CabinetHeading } from "./CabinetShell";
import type { CabinetNotification } from "./types";

export const DEFAULT_NOTIFICATIONS: CabinetNotification[] = [
  {
    id: "featured",
    author: "Serhii Falandysh",
    age: "2 hours ago",
    caption: "The notification caption will go here.",
    imageUrl: "/images/cabinet/notification-flower.png",
  },
  {
    id: "second",
    author: "Serhii Falandysh",
    age: "2 hours ago",
    caption: "The notification caption will go here.",
  },
  {
    id: "third",
    author: "Serhii Falandysh",
    age: "2 hours ago",
    caption: "The notification caption will go here.",
  },
];

function NotificationCard({ notification }: { notification: CabinetNotification }) {
  return (
    <article className="overflow-hidden rounded-[24px] bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      {notification.imageUrl ? (
        <div className="relative aspect-[2.2/1] min-h-[190px] w-full overflow-hidden">
          <Image
            src={notification.imageUrl}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 680px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex items-start gap-3 p-4">
        <Image
          src="/images/brand/gop-logo.svg"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-[14px] font-medium leading-5 text-[#f7f7f7]">{notification.author}</h2>
              <time className="text-[12px] leading-4 text-gop-menu-item-2">{notification.age}</time>
            </div>
            <button
              type="button"
              aria-label="Notification options"
              className="grid size-8 shrink-0 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gop-gold"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
          <p className="m-0 mt-3 text-[14px] leading-5 text-white/75">{notification.caption}</p>
        </div>
      </div>
    </article>
  );
}

export default function CabinetNotifications({
  notifications = DEFAULT_NOTIFICATIONS,
}: {
  notifications?: CabinetNotification[];
}) {
  return (
    <>
      <CabinetHeading
        title="Notifications"
        subtitle="Stay updated with the latest announcements from God of Prompt"
      />
      <div className="flex max-w-[680px] flex-col gap-3">
        {notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
    </>
  );
}
