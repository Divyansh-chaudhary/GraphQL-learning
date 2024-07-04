import { getAccessToken } from "../auth";
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  concat,
  createHttpLink,
  gql,
} from "@apollo/client";

const httpLink = createHttpLink({ uri: "http://localhost:9000/graphql" });
const authLink = new ApolloLink((operation, forward) => {
  if (getAccessToken())
    operation.setContext({
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
  return forward(operation);
});
const apolloClient = new ApolloClient({
  link: concat(authLink, httpLink),
  cache: new InMemoryCache(),
});
const jobDetailsFragment = gql`
  fragment JobDetails on Job {
    id
    date
    title
    company {
      id
      name
    }
    description
  }
`;
const getJobByIdQuery = gql`
  query JobById($id: ID!) {
    job(id: $id) {
      ...JobDetails
    }
  }
  ${jobDetailsFragment}
`;
export async function createJob({ title, description }) {
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput!) {
      job: createJob(input: $input) {
        ...JobDetails
      }
    }
    ${jobDetailsFragment}
  `;
  const {
    data: { job },
  } = await apolloClient.mutate({
    mutation,
    variables: { input: { title, description } },
    update: (cache, result) => {
      console.log("result :>> ", result);
      cache.writeQuery({
        query: getJobByIdQuery,
        variables: { id: result.data.job.id },
        data: result.data,
      });
    },
  });
  return job;
}

export async function getCompany(id) {
  const query = gql`
    query CompanyById($id: ID!) {
      company(id: $id) {
        id
        name
        description
        jobs {
          id
          date
          title
        }
      }
    }
  `;
  const {
    data: { company },
  } = await apolloClient.query({ query, variables: { id } });
  return company;
}

export async function getJob(id) {
  const {
    data: { job },
  } = await apolloClient.query({
    query: getJobByIdQuery,
    variables: { id },
  });
  return job;
}

export async function getJobs() {
  const query = gql`
    query {
      jobs {
        id
        date
        title
        company {
          id
          name
        }
      }
    }
  `;
  const { data } = await apolloClient.query({ query });
  return data.jobs;
}
