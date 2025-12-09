import { SetMetadata } from "@nestjs/common";
import { Role } from "../enums/role.enum";
export const Roles_key = "roles";

export const Roles = (...roles: Role[]) => SetMetadata(Roles_key, roles);