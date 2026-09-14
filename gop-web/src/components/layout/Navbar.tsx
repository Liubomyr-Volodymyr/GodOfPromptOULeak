import TopNavigation from "./TopNavigation";

export default function Navbar() {
  return (
    <TopNavigation
      variant="signed-out"
      className="z-50 px-6 pt-6 max-[640px]:px-3 max-[640px]:pt-4"
    />
  );
}
