import { redirect } from "next/navigation";

import { CABINET_DEFAULT_HREF } from "@/components/cabinet/navigation";

export default function UserCabinetPage() {
  redirect(CABINET_DEFAULT_HREF);
}
