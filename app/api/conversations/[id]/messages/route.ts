import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { AuditLogService, AuditEventType } from '@/lib/audit-logging';
import { InputSanitization } from '@/lib/input-sanitization';
import { redactContent } from '@/lib/redaction';

/**
 * GET /api/conversations/[id]/messages - Get messages for a conversation
 * Requires authentication and conversation access
 */
export const GET = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid conversation ID', 400);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found', 404);
    }

    // Check access permissions
    const isParticipant = conversation.organizationId === user.id || conversation.operatorId === user.id;
    if (!isParticipant) {
      return createErrorResponse('You do not have permission to view this conversation', 403);
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
            roleCategory: true,
            companyCategory: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  });

/**
 * POST /api/conversations/[id]/messages - Send a message in a conversation
 * Requires authentication and conversation access
 */
export const POST = withAuth(async (req, user) => {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[3];

    if (!id || id.length > 100) {
      return createErrorResponse('Invalid conversation ID', 400);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return createErrorResponse('Conversation not found', 404);
    }

    // Check access permissions
    const isParticipant = conversation.organizationId === user.id || conversation.operatorId === user.id;
    if (!isParticipant) {
      return createErrorResponse('You do not have permission to send messages in this conversation', 403);
    }

    // Check if conversation is blocked
    if (conversation.isBlocked) {
      return createErrorResponse('This conversation has been blocked', 403);
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.content || body.content.trim().length === 0) {
      return createErrorResponse('Message content is required', 400);
    }

    if (body.content.length > 5000) {
      return createErrorResponse('Message content is too long (max 5000 characters)', 400);
    }

    // Sanitize content
    const sanitizedContent = InputSanitization.sanitizeHTML(body.content);
    
    // Redact contact information
    const redactedContent = redactContent(sanitizedContent);
    
    // Determine recipient
    const recipientId = user.id === conversation.organizationId 
      ? conversation.operatorId 
      : conversation.organizationId;

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        recipientId,
        content: redactedContent,
        originalContent: body.content,
        wasRedacted: redactedContent !== sanitizedContent,
      },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
            roleCategory: true,
            companyCategory: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Log audit event
    await AuditLogService.log({
      userId: user.id,
      eventType: AuditEventType.MESSAGE_SENT,
      resourceType: 'Message',
      resourceId: message.id,
      metadata: { conversationId: id, wasRedacted: message.wasRedacted },
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  });