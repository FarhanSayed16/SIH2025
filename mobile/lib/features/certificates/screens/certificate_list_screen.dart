/// Phase 3.3.4: Certificate List Screen
/// Displays all certificates earned by the user

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/certificate_provider.dart';
import '../models/certificate_model.dart';
import 'certificate_detail_screen.dart';
import 'package:kavach/l10n/app_localizations.dart';
import 'package:intl/intl.dart';

class CertificateListScreen extends ConsumerStatefulWidget {
  const CertificateListScreen({super.key});

  @override
  ConsumerState<CertificateListScreen> createState() =>
      _CertificateListScreenState();
}

class _CertificateListScreenState
    extends ConsumerState<CertificateListScreen> {
  @override
  void initState() {
    super.initState();
    // Load certificates on screen load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myCertificatesProvider.notifier).loadCertificates();
    });
  }

  @override
  Widget build(BuildContext context) {
    final certificatesState = ref.watch(myCertificatesProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Certificates'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(myCertificatesProvider.notifier).loadCertificates(
                    forceRefresh: true,
                  );
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _buildBody(certificatesState, l10n),
    );
  }

  Widget _buildBody(MyCertificatesState state, AppLocalizations l10n) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error: ${state.error}',
              style: TextStyle(color: Colors.red[700]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                ref.read(myCertificatesProvider.notifier).clearError();
                ref.read(myCertificatesProvider.notifier).loadCertificates(
                      forceRefresh: true,
                    );
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.certificates.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.card_membership, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No certificates yet',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Earn certificates by completing modules and achieving milestones',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[500],
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(myCertificatesProvider.notifier).loadCertificates(
              forceRefresh: true,
            );
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: state.certificates.length,
        itemBuilder: (context, index) {
          final certificate = state.certificates[index];
          return _buildCertificateCard(certificate);
        },
      ),
    );
  }

  Widget _buildCertificateCard(Certificate certificate) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) =>
                  CertificateDetailScreen(certificateId: certificate.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Row(
            children: [
              // Certificate Icon
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.verified,
                  color: Theme.of(context).colorScheme.primary,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              // Certificate Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      certificate.displayTitle,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      certificate.achievement,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dateFormat.format(certificate.issuedAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[500],
                          ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

