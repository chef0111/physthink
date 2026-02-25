import { Loader } from '@/components/ui/loader';
import TextShimmer from '@/components/ui/text-shimmer';

const EditorFallback = () => {
  return (
    <div className="bg-card border-border flex h-99 w-full items-center justify-center gap-2 rounded-md border">
      <Loader />
      <TextShimmer duration={0.75}>Loading editor...</TextShimmer>
    </div>
  );
};

export default EditorFallback;
