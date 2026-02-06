from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, UsageLog, Transaction
from app.auth import get_current_active_user

router = APIRouter()


@router.get("/user")
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics for current user"""
    
    # Total spending
    total_spent = db.query(func.sum(UsageLog.cost)).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0.0
    
    # Total requests
    total_requests = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0
    
    # Total tokens
    total_input_tokens = db.query(func.sum(UsageLog.input_tokens)).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0
    
    total_output_tokens = db.query(func.sum(UsageLog.output_tokens)).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0
    
    # Usage by model
    usage_by_model = db.query(
        UsageLog.model,
        func.count(UsageLog.id).label('count'),
        func.sum(UsageLog.cost).label('total_cost'),
        func.sum(UsageLog.input_tokens).label('total_input'),
        func.sum(UsageLog.output_tokens).label('total_output')
    ).filter(
        UsageLog.user_id == current_user.id
    ).group_by(UsageLog.model).all()
    
    # Recent usage (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_spending = db.query(func.sum(UsageLog.cost)).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.created_at >= thirty_days_ago
    ).scalar() or 0.0
    
    # Usage by day (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    usage_by_day = db.query(
        func.date(UsageLog.created_at).label('date'),
        func.count(UsageLog.id).label('requests'),
        func.sum(UsageLog.cost).label('cost')
    ).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.created_at >= seven_days_ago
    ).group_by(func.date(UsageLog.created_at)).all()
    
    return {
        "total_spent": round(total_spent, 4),
        "total_requests": total_requests,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "recent_spending_30d": round(recent_spending, 4),
        "usage_by_model": [
            {
                "model": row.model,
                "count": row.count,
                "total_cost": round(row.total_cost, 4),
                "total_input": row.total_input,
                "total_output": row.total_output
            }
            for row in usage_by_model
        ],
        "usage_by_day": [
            {
                "date": str(row.date),
                "requests": row.requests,
                "cost": round(row.cost, 4)
            }
            for row in usage_by_day
        ]
    }


@router.get("/user/history")
async def get_user_usage_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent usage history for current user"""
    logs = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id
    ).order_by(desc(UsageLog.created_at)).limit(limit).all()
    
    return {
        "history": [
            {
                "id": log.id,
                "model": log.model,
                "input_tokens": log.input_tokens,
                "output_tokens": log.output_tokens,
                "cost": round(log.cost, 4),
                "session_type": log.session_type,
                "created_at": log.created_at
            }
            for log in logs
        ]
    }


@router.get("/user/transactions")
async def get_user_transactions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get transaction history for current user"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(desc(Transaction.created_at)).limit(limit).all()
    
    return {
        "transactions": [
            {
                "id": t.id,
                "amount": round(t.amount, 2),
                "type": t.type,
                "description": t.description,
                "balance_after": round(t.balance_after, 2),
                "created_at": t.created_at
            }
            for t in transactions
        ]
    }


@router.get("/admin/overview")
async def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get overall platform statistics (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Total users
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    
    # Total revenue (sum of all spending)
    total_revenue = db.query(func.sum(UsageLog.cost)).scalar() or 0.0
    
    # Total requests
    total_requests = db.query(func.count(UsageLog.id)).scalar() or 0
    
    # Total tokens processed
    total_tokens = db.query(
        func.sum(UsageLog.input_tokens) + func.sum(UsageLog.output_tokens)
    ).scalar() or 0
    
    # Recent activity (last 24h)
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    requests_24h = db.query(func.count(UsageLog.id)).filter(
        UsageLog.created_at >= twenty_four_hours_ago
    ).scalar() or 0
    
    revenue_24h = db.query(func.sum(UsageLog.cost)).filter(
        UsageLog.created_at >= twenty_four_hours_ago
    ).scalar() or 0.0
    
    # Top users by spending
    top_users = db.query(
        User.username,
        User.email,
        func.sum(UsageLog.cost).label('total_spent'),
        func.count(UsageLog.id).label('request_count')
    ).join(UsageLog).group_by(User.id).order_by(desc('total_spent')).limit(10).all()
    
    # Usage by model
    usage_by_model = db.query(
        UsageLog.model,
        func.count(UsageLog.id).label('count'),
        func.sum(UsageLog.cost).label('revenue')
    ).group_by(UsageLog.model).all()
    
    # Daily stats (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_stats = db.query(
        func.date(UsageLog.created_at).label('date'),
        func.count(UsageLog.id).label('requests'),
        func.sum(UsageLog.cost).label('revenue'),
        func.count(func.distinct(UsageLog.user_id)).label('active_users')
    ).filter(
        UsageLog.created_at >= thirty_days_ago
    ).group_by(func.date(UsageLog.created_at)).all()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_revenue": round(total_revenue, 2),
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "requests_24h": requests_24h,
        "revenue_24h": round(revenue_24h, 4),
        "top_users": [
            {
                "username": row.username,
                "email": row.email,
                "total_spent": round(row.total_spent, 4),
                "request_count": row.request_count
            }
            for row in top_users
        ],
        "usage_by_model": [
            {
                "model": row.model,
                "count": row.count,
                "revenue": round(row.revenue, 4)
            }
            for row in usage_by_model
        ],
        "daily_stats": [
            {
                "date": str(row.date),
                "requests": row.requests,
                "revenue": round(row.revenue, 4),
                "active_users": row.active_users
            }
            for row in daily_stats
        ]
    }


@router.post("/admin/user/{user_id}/adjust-balance")
async def adjust_user_balance(
    user_id: int,
    amount: float,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Adjust user balance (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update balance
    user.balance += amount
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        amount=amount,
        type="admin_adjustment",
        description=description or f"Admin adjustment by {current_user.username}",
        balance_after=user.balance
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "message": "Balance adjusted successfully",
        "new_balance": round(user.balance, 2)
    }
