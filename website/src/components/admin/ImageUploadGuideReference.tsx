import { IMAGE_UPLOAD_GUIDE_LIST } from "./imageUploadGuides";

export function ImageUploadGuideReference() {
  return (
    <section className="admin-card admin-upload-guide-reference" aria-labelledby="image-guide-heading">
      <h2 id="image-guide-heading" style={{ fontSize: "1.1rem", marginBottom: "0.35rem", color: "var(--downriver)" }}>
        Image upload guide
      </h2>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
        Use these sizes so photos look sharp in the Rest &amp; Rx app. Each upload field also shows the
        relevant spec inline.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table admin-upload-guide-table">
          <thead>
            <tr>
              <th>Content</th>
              <th>Size</th>
              <th>Ratio</th>
              <th>Where it appears</th>
            </tr>
          </thead>
          <tbody>
            {IMAGE_UPLOAD_GUIDE_LIST.map((guide) => (
              <tr key={guide.key}>
                <td>{guide.label}</td>
                <td>{guide.recommendedSize}</td>
                <td>{guide.aspectRatio}</td>
                <td>{guide.whereUsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem", marginBottom: 0 }}>
        Accepted formats: JPG, PNG, WebP, or GIF · Max 32 MB per image
      </p>
    </section>
  );
}
