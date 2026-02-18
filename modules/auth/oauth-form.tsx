import { Button } from '@/components/ui/button';
import { GoogleIcon, GithubIcon } from '@/components/icons';
import { Loader } from '@/components/ui/loader';

interface OAuthFormProps {
  googlePending?: boolean;
  githubPending?: boolean;
  googleLogin: () => Promise<void>;
  githubLogin: () => Promise<void>;
}

export const OAuthForm = (props: OAuthFormProps) => {
  return (
    <div className="mx-6 space-y-2">
      <Button
        variant="secondary"
        className="w-full"
        disabled={props.googlePending || props.githubPending}
        onClick={props.googleLogin}
      >
        {props.googlePending ? (
          <>
            <Loader />
            <span>Redirecting...</span>
          </>
        ) : (
          <>
            <GoogleIcon data-icon="inline-start" />
            <span>Continue with Google</span>
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        disabled={props.githubPending || props.googlePending}
        onClick={props.githubLogin}
      >
        {props.githubPending ? (
          <>
            <Loader />
            <span>Redirecting...</span>
          </>
        ) : (
          <>
            <GithubIcon data-icon="inline-start" />
            <span>Continue with GitHub</span>
          </>
        )}
      </Button>
    </div>
  );
};
