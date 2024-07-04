import { GraphQLError } from "graphql";
import { getCompany } from "./db/companies.js";
import {
  createJob,
  deleteJob,
  getJob,
  getJobs,
  getJobsByCompany,
  updateJob,
} from "./db/jobs.js";
import { getUser } from "./db/users.js";

export const resolvers = {
  Query: {
    company: async (_root, { id }) => {
      const company = await getCompany(id);
      if (!company) {
        throw notFoundError("No Company found with id " + id);
      }
      return company;
    },
    job: async (_root, { id }) => {
      const job = await getJob(id);
      if (!job) {
        throw notFoundError("No Job found with id " + id);
      }
      return job;
    },
    jobs: () => getJobs(),
  },

  Mutation: {
    createJob: async (_root, { input }, { auth }) => {
      if (!auth) {
        throw unauthorizedError("not authorized user");
      }
      const user = await getUser(auth.sub);
      return createJob({ companyId: user.companyId, ...input });
    },

    deleteJob: (_root, { id }) => deleteJob(id),

    updateJob: (_root, { input }) => {
      return updateJob(input);
    },
  },

  Company: {
    jobs: (company) => getJobsByCompany(company.id),
  },

  Job: {
    company: (job) => getCompany(job.companyId),
    date: (job) => toIsoDate(job.createdAt),
  },
};

function notFoundError(message) {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}

function unauthorizedError(message) {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHORIZED" },
  });
}

function toIsoDate(value) {
  return value.slice(0, "yyyy-mm-dd".length);
}
