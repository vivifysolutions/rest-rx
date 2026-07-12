import {
  getImageUploadGuide,
  type ImageUploadGuide,
  type ImageUploadGuideKey,
} from "./imageUploadGuides";

type Props = {
  guide: ImageUploadGuideKey | ImageUploadGuide;
  compact?: boolean;
};

export function UploadGuidePanel({ guide: guideProp, compact = false }: Props) {
  const guide =
    typeof guideProp === "string" ? getImageUploadGuide(guideProp) : guideProp;

  if (compact) {
    return (
      <aside className="admin-upload-guide admin-upload-guide--compact" aria-label="Image size guide">
        <p className="admin-upload-guide__title">Recommended</p>
        <p className="admin-upload-guide__size">
          {guide.recommendedSize} · {guide.aspectRatio}
        </p>
        <p className="admin-upload-guide__meta">
          {guide.formats} · max {guide.maxFileSize}
        </p>
      </aside>
    );
  }

  return (
    <aside className="admin-upload-guide" aria-label="Image size guide">
      <p className="admin-upload-guide__title">{guide.label}</p>
      <dl className="admin-upload-guide__specs">
        <div>
          <dt>Recommended size</dt>
          <dd>{guide.recommendedSize}</dd>
        </div>
        <div>
          <dt>Aspect ratio</dt>
          <dd>{guide.aspectRatio}</dd>
        </div>
        <div>
          <dt>Formats</dt>
          <dd>{guide.formats}</dd>
        </div>
        <div>
          <dt>Max file size</dt>
          <dd>{guide.maxFileSize}</dd>
        </div>
        <div>
          <dt>Shown in app</dt>
          <dd>{guide.whereUsed}</dd>
        </div>
      </dl>
      {guide.tips ? <p className="admin-upload-guide__tips">{guide.tips}</p> : null}
    </aside>
  );
}
