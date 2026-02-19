import { requireAuth } from "@/lib/auth-utils";
import { getUserAvatarUrl } from "@/actions/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABELS } from "@/lib/constants";
import { AvatarUpload } from "@/components/profile/avatar-upload";

export default async function ProfilePage() {
  const user = await requireAuth();
  const avatarUrl = await getUserAvatarUrl(user.id);

  return (
    <div className="p-4 md:p-6 max-w-2xl md:max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Card>
        <CardContent className="pt-6">
          {/* Desktop: side-by-side, Mobile: stacked */}
          <div className="md:flex md:gap-10">
            {/* Avatar */}
            <div className="md:shrink-0">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                userName={user.name || "User"}
              />
            </div>

            <Separator className="my-6 md:hidden" />
            <Separator orientation="vertical" className="hidden md:block h-auto self-stretch" />

            {/* Details */}
            <div className="flex-1 grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Role</p>
                <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Account</p>
                <p className="font-medium text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
