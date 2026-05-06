import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit-logging';

export const PATCH = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Extract ID from URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split('/');
      const feeRecordId = pathSegments[4]; // /api/admin/fee-records/[id]
      const body = await req.json();
      const { status, amount } = body;

      if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
      }

      const validStatuses = ['Fee Pending', 'Invoiced', 'Collected', 'Waived'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      // Prepare update data
      const updateData: any = {
        status,
      };

      if (status === 'Invoiced') {
        updateData.invoicedAt = new Date();
      }

      if (status === 'Collected') {
        if (amount === undefined || amount === null) {
          return NextResponse.json({ error: 'Amount is required when marking as collected' }, { status: 400 });
        }
        updateData.collectedAmount = amount;
        updateData.collectedAt = new Date();
      }

      // Update fee record
      const updatedFeeRecord = await prisma.feeRecord.update({
        where: { id: feeRecordId },
        data: updateData,
      });

      // Log audit event
      await logAuditEvent({
        eventType: 'FEE_UPDATED' as any,
        userId: user.id,
        resourceType: 'FeeRecord',
        resourceId: feeRecordId,
        metadata: {
          previousStatus: updatedFeeRecord.status,
          newStatus: status,
          amount: amount,
        },
        severity: 'medium',
      });

      return NextResponse.json({
        success: true,
        message: 'Fee record updated successfully',
        feeRecord: updatedFeeRecord,
      });
    } catch (error) {
      console.error('Error updating fee record:', error);
      return NextResponse.json({ error: 'Failed to update fee record' }, { status: 500 });
    }
  });