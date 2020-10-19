# Survival

This tool simulates survivable failures in different homogeneous network topologies in a
CockroachDB cluster.

This is done by simulating a single range and placing its replicas following the default diversity
rules of Cockroach for maximum survivability. It then finds  the maximum number of failures that
the cluster can suffer without experiencing any unavailability.

You can select whichever failure mode you're interested in.  Note that each failure mode occurs at a
different level.  Failures modes show how many of the current level can fail plus any extra lower
level failures.  i.e.:

If you have a 3 Region, 2 DC per Region, 3 AZ per DC and 3 Nodes per AZ setup with a replication
factor of 9x, you can survive the following scenarios:

- 1 Region and 1 additional AZ
- 1 DC and 1 additional AZ
- 4 Availability Zones
- 4 Nodes

But note that these are different scenarios and cannot overlap.

## Limitations

### Non-Homogeneous Clusters

This tool doesn't handle non-homogeneous clusters.  If you are trying to look at the
survivability of clusters that have a different number of DCs per region, or AZs per DC or nodes
per AZ, then just pick the smallest number of the options.  This should approximate the
failures.

### Constraints

If there are Required or Prohibited constraints (see
[here](https://www.cockroachlabs.com/docs/v20.1/configure-replication-zones.html#types-of-constraints))
on the cluster, you must treat each constraint zone differently as they will have different failure
modes.  Just setup the cluster as if the constraint is being followed.  (i.e. remove any prohibited
DC or only include required ones)

Per replica constraints cannot yet be handled by this tool, but it should provide a good starting
point.

## Instructions

### Requirements

- Node v14.13.1 (or later)
- NPM v6.14.8 (or later)
- yarn v1.22.10 (or later)

### To Run

1. clone the repo
1. install all dependencies: `yarn`
1. start the server `yarn start`

## Bugs, improvements, etc

Please feel free to issue PRs and/or issues for bugs.

___All help is appreciated!___
