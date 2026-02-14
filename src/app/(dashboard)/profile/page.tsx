import { requireAuth } from "@/lib/auth-utils";
import { getUserAvatarUrl } from "@/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABELS } from "@/lib/constants";
import { AvatarUpload } from "@/components/profile/avatar-upload";

export default async function ProfilePage() {
  const user = await requireAuth();
  const avatarUrl = await getUserAvatarUrl(user.id);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Card>
        <CardContent className="pt-6">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            userName={user.name || "User"}
          />
          <Separator className="my-6" />
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
