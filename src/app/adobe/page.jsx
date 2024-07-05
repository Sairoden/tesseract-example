// 45a8e546c01a4b0d901c8c9eecf1aefa

export default function AdobePage({ url }) {
  const viewerRef = useRef(null);

  return <div id="adobe-dc-view" ref={viewerRef} style={{ height: "100vh" }} />;
}
