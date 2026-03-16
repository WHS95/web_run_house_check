import dynamic from "next/dynamic";

const MapTemplate = dynamic(
    () => import("@/components/templates/MapTemplate"),
    { ssr: false }
);

export default function MapPage() {
    return <MapTemplate />;
}
