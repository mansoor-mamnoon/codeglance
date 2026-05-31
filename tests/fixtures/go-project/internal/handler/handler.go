package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Handler holds the application dependencies for all HTTP handlers.
type Handler struct {
	log *zap.Logger
}

// New creates a new Handler with the given dependencies.
func New(log *zap.Logger) *Handler {
	return &Handler{log: log}
}

// RegisterRoutes wires all API routes to the given router.
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", h.Health)
		v1.GET("/users", h.ListUsers)
		v1.POST("/users", h.CreateUser)
		v1.GET("/users/:id", h.GetUser)
	}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) ListUsers(c *gin.Context) {
	h.log.Info("listing users")
	c.JSON(http.StatusOK, gin.H{"users": []interface{}{}})
}

func (h *Handler) CreateUser(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"message": "created"})
}

func (h *Handler) GetUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}
