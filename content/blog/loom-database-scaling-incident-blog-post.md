---
date: 2026-04-10
---

Below is a copy of the public postmortem following Loom's October 27, 2025 database scaling incident. It was originally posted at [https://loom.status.atlassian.com/incidents/t2nvjx3knbb4]().

# Loom performance degraded

## Summary

On October 27, 2025 between 12:30 and 20:55 UTC, Loom was significantly degraded for all customers. Users also experienced short periods of degradation on October 28, 2025 from 20:26 to 20:33 UTC and October 30, 2025 19:22 to 19:27 UTC.

During the incident, users experienced issues with intermittent or failing playback, recordings, transcript generation, issues logging in, and general errors or slowness across the service. Our monitoring shows that between 20% and 80% of user interactions were failing during these periods, with failures growing in the later half of the incident.

We know that outages impact your productivity and we apologize to customers who were impacted during this incident. We are taking immediate steps to improve Loom’s reliability based on our learnings from this incident.

## Analysis

Beginning on October 25, 2025, Loom’s primary database cluster showed early indicators of a problem. Resource usage was growing slowly and replication slots were not keeping up. Engineers were alerted on October 26, 2025 and began investigating. We saw no signs of customer impact at this time, however, we did identify an issue with a retrying background job running unsuccessfully in a loop. We shipped a temporary fix for this issue and planned to investigate further the next day.

On Monday, October 27, 2025, the issue resurfaced significantly as usage increased, and we began observing customer impact. Engineers were monitoring the issue closely and engaged immediately. It was clear that our database was not performing as expected, and over the next few hours, we made multiple attempts at mitigation. Notably, we scaled up the database writer and two readers to relieve resource pressure. This did not help, and user impact remained unchanged.

Over the next several hours, we made multiple attempts to restore normal database performance. We rolled back recent changes, optimized individual query performance, added new indexes, updated database configurations, and vacuumed large system and application tables. These changes provided some short-term relief, but performance repeatedly worsened. Dropping our replication slots did resolve resource pressure, but did not improve overall query performance.

We then observed that identical queries were planning and executing much faster on the writer than on our reader instances, so we decided to shift all query traffic to the single writer instance. This change immediately mitigated the customer impact.

While this action resolved the immediate issue, it was not a stable state for our service long term. Over the next few days, we made multiple attempts to revert to our typical single-writer, dual-reader architecture. Each time, we saw the same issues resurface, resulting in short periods of degradation. In between each of these attempts, we made further optimizations to our database usage, but we were still not seeing the performance we expected when adding back our reader instances. This was especially challenging because our services worked as expected with a single reader, and we only observed this degradation when adding a second reader to the cluster.

On October 31, 2025, we tried the failover with a smaller instance size, similar to our original architecture before the vertical scaling attempt. This succeeded, restoring the Loom architecture to normal and fully mitigating the incident.

## Root Cause

Broadly speaking, this incident can be divided into two parts. First, the initial degradation was caused by multiple Loom changes made in the months before the incident. Second, the extended mitigation resulted unexpectedly from our attempt to mitigate scaling up the instance sizes.

The first part of this incident was caused by a complex interaction of multiple old and recent changes to Loom services:

- For years, Loom has had a background job that uses nested database transactions, a rare pattern in our codebase. A parent transaction is opened for the entire job, with child transactions for each batch of work. This job has been reliable, but it will retry multiple times in the event of failure. This job is relatively low-volume and usually quick, but can require significant database work in rare cases.
- Over the last few months, in order to support upcoming features and migrations, baseline load and activity on Loom’s database increased significantly.
- On October 14, 2025, also to support an upcoming feature, a broad change was made to how the Loom app handles database transactions. This change was only intended to take effect in our test and staging environments, but in special cases related to nested transactions, it also applied in production.
- On October 25, 2025, the combined changes triggered a slow, increasing degradation of our database. Several large background job runs combined and failed, causing retries to keep a permanent open transaction on the database. This degraded replication slots and autovacuum, leading to table bloat across the database. On October 27th, 2025, this degradation began impacting our users.
- After removing the initial triggers, the database continued to degrade and required significant manual intervention to stabilize. Recovery was complicated because one attempted mitigation (vertical instance scaling) triggered a new problem.

The second part of this incident was caused by our earlier mitigation attempt of scaling up our instance sizes to handle the increased load from the first part:

- Early on in the incident, in response to increased database resource usage, we attempted to mitigate by vertically scaling our instances to larger sizes. We generally consider this a safe and often effective mitigation.
- This change unexpectedly made the database degradation worse. The kind of degradation we observed from the larger instances was similar to the kind of degradation we already observed in the first part of the incident. After the incident we learned directly from our cloud provider that the larger instance sizes use a separate memory architecture that performs significantly worse on our workload.
- This performance difference between the instance types is especially evident when opening new connections. As part of our investigation, we also found an issue with our connection pooler that leads to excess connection churn when pointing at a DNS load-balanced reader endpoint. This explains why we only observed issues when adding a second reader to the cluster, and not with a single-writer single-reader configuration.

## Remediations and Improvements

As part of our investigation and mitigation efforts during the incident, we have already completed several key actions to address similar issues, including:

- Optimized transaction handling within our application.
- Improved performance of high-volume and poor-performing queries.
- Improved monitoring and observability of vacuum status and table bloat.
- Internal tooling improvements for easier debugging.
- In-product banner to alert users during incidents.

Additionally, we are prioritizing the following improvement actions:

- Further improvements to transaction handling and monitoring.
- Optimization of our connection pooling configuration.
- Database index usage optimizations.
- Database configuration improvements.
- Improvements to autovacuum parameters.
- Improvements to how we measure and monitor customer impact.

Thank you,
Atlassian
