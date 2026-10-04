import { UserResolvable, resolveUserId } from "../../util/resolve";
import { UserType, Users } from "../../users";

export function checkUserType(user: UserResolvable, type: UserType[], checkType: "any" | "all"): boolean {
  const userId = resolveUserId(user);
  if (!userId) return false;

  const userTypes = Users.find(u => u.id == userId)?.type ?? [];
  if (!userTypes.length) return false;

  if (type.length === 0) {
    return checkType === "all";
  }

  if (checkType === "any") {
    return type.some((targetType) => userTypes.includes(targetType));
  }

  return type.every((targetType) => userTypes.includes(targetType));
}