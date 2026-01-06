import { Hero } from "@/components/landing/Hero";
import { ServiceCategories } from "@/components/landing/ServiceCategories";
import { FeaturedServices } from "@/components/landing/FeaturedServices";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceCategories />
      <FeaturedServices />
    </>
  );
}
