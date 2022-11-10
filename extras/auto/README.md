# auto

![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.0.0](https://img.shields.io/badge/AppVersion-1.0.0-informational?style=flat-square)

Helm Chart für auto

**Homepage:** <https://www.www.h-ka.de>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| Jürgen Zimmermann | <Juergen.Zimmermann@h-ka.de> | <https://www.h-ka.de> |

## Requirements

Kubernetes: `>=1.24.0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| autoscaling.enabled | bool | `true` | Ist Autoscaling aktiviert? |
| autoscaling.maxReplicas | int | `100` | Maximale Anzahl an Replicas |
| autoscaling.minReplicas | int | `1` | Mininmale Anzahl an Replicas |
| autoscaling.targetCPUUtilizationPercentage | int | `80` | Maximale CPU-Auslastung |
| autoscaling.targetMemoryUtilizationPercentage | int | `80` | Maximale RAM-Auslastung |
| dbPassword | string | `"Change Me!!!"` | Passwort für die DB |
| dbPopulate | string | `"false"` | Neuladen der DB beim Start des Appservers |
| dbUser | string | `"auto"` | Benutzername für die DB |
| deployment.containerPort | int | `3000` | Port innerhalb des Containers |
| deployment.secretNameDB | string | `"postgres"` | Name der Secret-Ressource beim DB-System |
| fullnameOverride | string | `""` | _Fully Qualified Name (FQN)_ ist defaultmäßig im Chart bei `name` und kann überschrieben werden. |
| gid | int | `1000` | ID der Linux-Gruppe |
| image.name | string | `"auto"` | Name des Image |
| image.repository | string | `"juergenzimmermann"` | Repository als Präfix beim Image-Namen |
| image.tag | string | `"1.0.0"` | Image-Tag |
| livenessProbe.failureThreshold | int | `3` | Max. Anzahl an Fehlversuchen bei den Liveness-Proben |
| livenessProbe.initialDelay | int | `0` | Anzahl Sekunden, bis die Probe für Liveness abgesetzt wird |
| livenessProbe.period | int | `10` | periodischer Abstand zwischen den Liveness-Proben in Sekunden |
| livenessProbe.timeout | int | `1` | Timeout für Liveness-Probe in Sekunden |
| logHealthyPretty | string | `"false"` | Ausgabemodus bei Nest Terminus aufbereiten ("pretty") |
| logPretty | string | `"false"` | Ausgabemodus bei Pino |
| loglevel | string | `"info"` | Loglevel für auto |
| nameOverride | string | `""` | Defaultwert ist im Chart bei `name` und kann überschrieben werden. |
| namespace | string | `"acme"` | Namespace in NOTES.txt |
| nodeConfig | string | `"production"` | Konfigurationsmodus für Node |
| readinessProbe.failureThreshold | int | `3` | Max. Anzahl an Fehlversuchen bei den Readiness-Proben |
| readinessProbe.initialDelay | int | `0` | Anzahl Sekunden, bis die Probe für Readiness abgesetzt wird |
| readinessProbe.period | int | `10` | periodischer Abstand zwischen den Readiness-Proben in Sekunden |
| readinessProbe.timeout | int | `1` | Timeout für Readiness-Probe in Sekunden |
| replicas | int | `2` | Anzahl Replica im Pod von Kubernetes |
| resourcesLimits.cpu | string | `"600m"` | Maximalanforderung an CPU-Ressourcen in _millicores_, z.B. `500m` oder `1` |
| resourcesLimits.ephemeral | string | `"64Mi"` | Maximalanforderung an flüchtigen Speicher für z.B. Caching und Logs |
| resourcesLimits.memory | string | `"512Mi"` | Maximalanforderung an Memory-Resourcen als _mebibyte_ Wert |
| resourcesRequests.cpu | Mindest- | `"500m"` | Anforderung an CPU-Ressourcen in _millicores_, z.B. `500m` oder `1` |
| resourcesRequests.ephemeral | Mindest- | `"64Mi"` | Anforderung an flüchtigen Speicher für z.B. Caching und Logs |
| resourcesRequests.memory | Mindest- | `"512Mi"` | Anforderung an Memory-Resourcen als _mebibyte_ Wert |
| servicePort | int | `3000` | Port des Kubernetes-Service |
| uid | int | `1000` | ID des Linux-Users |
| userPasswordEncoded | string | `"Unused in Production"` | Verschlüsseltes Passwort in `users.ts`` |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.11.0](https://github.com/norwoodj/helm-docs/releases/v1.11.0)