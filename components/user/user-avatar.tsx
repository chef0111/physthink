import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
  name: string | undefined;
  image?: string | null;
  imageClassName?: string;
  fallbackClassName?: string;
  href?: string | null;
}

const UserAvatar = ({
  name,
  image,
  className,
  imageClassName,
  fallbackClassName,
  ...props
}: UserAvatarProps) => {
  const initials = name
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn('no-focus relative', className)} {...props}>
      <AvatarImage
        src={image ?? ''}
        alt={name}
        className={cn('object-cover', imageClassName)}
      />
      <AvatarFallback
        className={cn(
          'font-esbuild bg-primary font-bold tracking-wider text-white select-none',
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
