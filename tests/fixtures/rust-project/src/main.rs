use anyhow::Result;
use clap::Parser;
use tracing_subscriber::EnvFilter;

mod cli;
mod config;
mod processor;

use cli::{Cli, Commands};

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Process { path, depth } => {
            processor::run(&path, depth, &cli.format).await?;
        }
        Commands::Fetch { url } => {
            processor::fetch(&url, &cli.format).await?;
        }
        Commands::Info => {
            println!("myservice {}", env!("CARGO_PKG_VERSION"));
        }
    }

    Ok(())
}
