use clap::{Parser, Subcommand};

/// A fast, opinionated file processing tool
#[derive(Parser)]
#[command(name = "myservice", version, about, long_about = None)]
pub struct Cli {
    /// Enable verbose output
    #[arg(short, long)]
    pub verbose: bool,

    /// Output format
    #[arg(short, long, default_value = "text")]
    pub format: String,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Process files in a directory
    Process {
        /// Directory to process
        #[arg(value_name = "PATH")]
        path: std::path::PathBuf,

        /// Maximum depth to recurse
        #[arg(long, default_value = "10")]
        depth: usize,
    },
    /// Fetch and process from a remote URL
    Fetch {
        /// URL to fetch from
        url: String,
    },
    /// Show version information
    Info,
}
