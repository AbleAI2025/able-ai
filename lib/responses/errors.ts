export const ERROR_CODES = {
    "BAD_REQUEST": {
        code: 400,
        message: 'Bad Request',
    },
    "UNAUTHORIZED": {
        code: 401,
        message: 'Unauthorized: You must be logged in to access this resource.',
    },
    "FORBIDDEN": {
        code: 403,
        message: 'Forbidden: You do not have permission to perform this action.',
    },
    "NOT_FOUND": {
        code: 404,
        message: 'Not Found',
    },
}

export const ERROR_MESSAGES = {
  TOKEN_REQUIRED: {
    code: 401,
    message: "Authentication token is required",
  },
  USER_NOT_FOUND: {
    code: 404,
    message: "User not found",
  },
  WORKER_PROFILE_NOT_FOUND: {
    code: 404,
    message: "Worker profile not found",
  },
  UNAUTHORIZED: {
    code: 401,
    message: "Unauthorized access",
  },
  QUALIFICATION_NOT_FOUND: {
    code: 404,
    message: "Qualification not found",
  },
  EQUIPMENT_NOT_FOUND: {
    code: 404,
    message: "Equipment not found",
  },
  SKILL_NOT_FOUND: {
    code: 404,
    message: "Skill not found",
  },
  FAILED_TO_CREATE: {
    code: 500,
    message: "Error creating",
  },
  FAILED_TO_DELETE: {
    code: 500,
    message: "Error deleting",
  },
  FAILED_TO_EDIT: {
    code: 500,
    message: "Error editing",
  },
  SKILL_ID_REQUIRED: {
    code: 400,
    message: "Skill ID is required",
  },
} as const;

